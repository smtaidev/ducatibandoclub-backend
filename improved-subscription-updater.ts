import cron from 'node-cron';

import { SubscriptionStatus } from '@prisma/client';
import prisma from './src/app/lib/prisma';
import stripe from './src/app/lib/stripe';

// Enhanced retry mechanism for Stripe API calls
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000  // 10 seconds
};

// Rate limiter to prevent overwhelming Stripe API
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private readonly maxConcurrent: number;

  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const fn = this.queue.shift()!;
    
    try {
      await fn();
    } finally {
      this.running--;
      this.processQueue();
    }
  }
}

const rateLimiter = new RateLimiter(5); // Max 5 concurrent Stripe API calls

// Enhanced retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = defaultRetryOptions
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain error types
      if (error.type === 'StripeInvalidRequestError' || 
          error.statusCode === 404) {
        throw error;
      }
      
      if (attempt === options.maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        options.maxDelay
      );
      
      console.warn(`Retry attempt ${attempt + 1} failed, waiting ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Map Stripe subscription status to our enum
const mapStripeStatusToSubscriptionStatus = (stripeStatus: string): SubscriptionStatus => {
  switch (stripeStatus.toLowerCase()) {
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'canceled':
    case 'cancelled':
      return SubscriptionStatus.CANCELLED;
    case 'incomplete':
    case 'incomplete_expired':
    case 'past_due':
    case 'unpaid':
    default:
      return SubscriptionStatus.INACTIVE;
  }
};

// Enhanced subscription status updater with improved performance and error handling
const updateSubscriptionStatuses = async (): Promise<{
  processed: number;
  updated: number;
  errors: number;
}> => {
  const startTime = Date.now();
  let processed = 0;
  let updated = 0;
  let errors = 0;

  try {
    console.log('🚀 Starting subscription status update...');
    
    // Batch processing: Fetch subscriptions in batches to reduce memory usage
    const BATCH_SIZE = 50;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const subscriptionBatch = await prisma.subscription.findMany({
        where: {
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.INACTIVE, SubscriptionStatus.CANCELLED],
          },
          stripeSubscriptionId: { not: null }, // Only process subscriptions with valid Stripe IDs
        },
        select: {
          id: true,
          userId: true,
          stripeSubscriptionId: true,
          status: true,
        },
        take: BATCH_SIZE,
        skip,
        orderBy: { updatedAt: 'asc' } // Process oldest updates first
      });

      if (subscriptionBatch.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`📦 Processing batch of ${subscriptionBatch.length} subscriptions (skip: ${skip})`);

      // Process batch with concurrency control
      const batchPromises = subscriptionBatch.map(async (subscription) => {
        try {
          processed++;
          
          // Use rate limiter to control Stripe API calls
          const stripeSubscription = await rateLimiter.execute(() => 
            retryWithBackoff(() => 
              stripe.subscriptions.retrieve(subscription.stripeSubscriptionId!)
            )
          );

          const mappedStatus = mapStripeStatusToSubscriptionStatus(stripeSubscription.status);
          
          // Fixed status comparison - properly compare enum values
          const needsUpdate = mappedStatus !== subscription.status;
          
          if (needsUpdate) {
            // Use transaction to ensure data consistency
            await prisma.$transaction(async (tx) => {
              // Update subscription
              await tx.subscription.update({
                where: { id: subscription.id },
                data: {
                  status: mappedStatus,
                  currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                  currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                  cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
                  canceledAt: stripeSubscription.canceled_at 
                    ? new Date(stripeSubscription.canceled_at * 1000) 
                    : null,
                  updatedAt: new Date(), // Explicitly set updated timestamp
                },
              });

              // Update user pro status
              const isActive = stripeSubscription.status === 'active';
              await tx.user.update({
                where: { id: subscription.userId },
                data: {
                  isProMember: isActive,
                  subscriptionStatus: mappedStatus,
                  membershipEnds: isActive 
                    ? new Date(stripeSubscription.current_period_end * 1000)
                    : new Date(),
                },
              });
            });

            updated++;
            console.log(
              `✅ Updated subscription ${subscription.id}: ${subscription.status} → ${mappedStatus}`
            );
          }
        } catch (error: any) {
          errors++;
          console.error(
            `❌ Failed to update subscription ${subscription.id}:`, 
            {
              subscriptionId: subscription.id,
              userId: subscription.userId,
              error: error.message,
              stack: error.stack?.split('\n').slice(0, 3).join('\n'), // Truncated stack trace
            }
          );
        }
      });

      // Wait for all subscriptions in this batch to complete
      await Promise.allSettled(batchPromises);
      
      skip += BATCH_SIZE;
    }

    const duration = Date.now() - startTime;
    console.log(
      `🎉 Subscription status update completed in ${duration}ms:`,
      { processed, updated, errors }
    );

    return { processed, updated, errors };
  } catch (error: any) {
    errors++;
    console.error('💥 Failed to update subscription statuses:', {
      error: error.message,
      processed,
      updated,
      errors,
    });
    
    throw error;
  }
};

// Enhanced expired subscriptions handler
const handleExpiredSubscriptions = async (): Promise<{
  processed: number;
  expired: number;
  errors: number;
}> => {
  const startTime = Date.now();
  let processed = 0;
  let expired = 0;
  let errors = 0;

  try {
    console.log('⏰ Starting expired subscriptions check...');
    
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
        userId: true,
        stripeSubscriptionId: true,
        currentPeriodEnd: true,
      },
    });

    console.log(`📋 Found ${expiredSubscriptions.length} potentially expired subscriptions`);

    const promises = expiredSubscriptions.map(async (subscription) => {
      try {
        processed++;
        
        if (subscription.stripeSubscriptionId) {
          const stripeSubscription = await rateLimiter.execute(() =>
            retryWithBackoff(() =>
              stripe.subscriptions.retrieve(subscription.stripeSubscriptionId!)
            )
          );

          if (stripeSubscription.status !== 'active') {
            const mappedStatus = mapStripeStatusToSubscriptionStatus(stripeSubscription.status);
            
            await prisma.$transaction(async (tx) => {
              await tx.subscription.update({
                where: { id: subscription.id },
                data: {
                  status: mappedStatus,
                  canceledAt: stripeSubscription.canceled_at 
                    ? new Date(stripeSubscription.canceled_at * 1000)
                    : new Date(),
                },
              });

              await tx.user.update({
                where: { id: subscription.userId },
                data: {
                  isProMember: false,
                  subscriptionStatus: mappedStatus,
                  membershipEnds: new Date(),
                },
              });
            });

            expired++;
            console.log(`⌛ Handled expired subscription for user ${subscription.userId}`);
          }
        } else {
          // No Stripe subscription ID, mark as cancelled
          await prisma.$transaction(async (tx) => {
            await tx.subscription.update({
              where: { id: subscription.id },
              data: {
                status: SubscriptionStatus.CANCELLED,
                canceledAt: new Date(),
              },
            });

            await tx.user.update({
              where: { id: subscription.userId },
              data: {
                isProMember: false,
                subscriptionStatus: SubscriptionStatus.CANCELLED,
                membershipEnds: new Date(),
              },
            });
          });

          expired++;
          console.log(`🚫 Marked subscription ${subscription.id} as cancelled (no Stripe ID)`);
        }
      } catch (error: any) {
        errors++;
        console.error(`❌ Failed to handle expired subscription ${subscription.id}:`, {
          subscriptionId: subscription.id,
          error: error.message,
        });
      }
    });

    await Promise.allSettled(promises);

    const duration = Date.now() - startTime;
    console.log(
      `✅ Expired subscriptions handling completed in ${duration}ms:`,
      { processed, expired, errors }
    );

    return { processed, expired, errors };
  } catch (error: any) {
    console.error('💥 Failed to handle expired subscriptions:', {
      error: error.message,
      processed,
      expired,
      errors,
    });
    
    throw error;
  }
};

// Export the enhanced functions
export {
  updateSubscriptionStatuses,
  handleExpiredSubscriptions,
  mapStripeStatusToSubscriptionStatus,
  retryWithBackoff,
  RateLimiter,
};

// Example usage with monitoring
export const runSubscriptionUpdate = async () => {
  try {
    const result = await updateSubscriptionStatuses();
    
    // Log metrics for monitoring
    console.log('📊 Subscription Update Metrics:', {
      timestamp: new Date().toISOString(),
      processed: result.processed,
      updated: result.updated,
      errors: result.errors,
      successRate: result.processed > 0 ? ((result.processed - result.errors) / result.processed * 100).toFixed(2) + '%' : '0%',
    });

    return result;
  } catch (error) {
    console.error('🚨 Subscription update failed:', error);
    throw error;
  }
};
