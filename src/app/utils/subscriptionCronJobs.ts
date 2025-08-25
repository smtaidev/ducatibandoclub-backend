import * as cron from 'node-cron';
import stripe from '../lib/stripe';
import { SubscriptionStatus } from '@prisma/client';
import prisma from '../lib/prisma';

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

// Simple but effective subscription status updater
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
    
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.INACTIVE, SubscriptionStatus.CANCELLED],
        },
        stripeSubscriptionId: { not: null },
      },
      select: {
        id: true,
        userId: true,
        stripeSubscriptionId: true,
        status: true,
      },
    });

    console.log(`📦 Found ${subscriptions.length} subscriptions to check`);

    for (const subscription of subscriptions) {
      try {
        processed++;
        
        // Get subscription from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId!
        );

        const mappedStatus = mapStripeStatusToSubscriptionStatus(stripeSubscription.status);
        
        // Check if status changed
        if (mappedStatus !== subscription.status) {
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
              },
            });

            // Update user pro status - THIS IS THE KEY FIX
            const isActive = mappedStatus === SubscriptionStatus.ACTIVE;
            await tx.user.update({
              where: { id: subscription.userId },
              data: {
                isProMember: isActive,
                subscriptionStatus: mappedStatus, // This was missing!
                membershipEnds: isActive 
                  ? new Date(stripeSubscription.current_period_end * 1000)
                  : new Date(),
              },
            });
          });

          updated++;
          console.log(`✅ Updated subscription ${subscription.id}: ${subscription.status} → ${mappedStatus}`);
        }
      } catch (error: any) {
        errors++;
        console.error(`❌ Failed to update subscription ${subscription.id}:`, {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`🎉 Subscription status update completed in ${duration}ms:`, {
      processed,
      updated,
      errors,
    });

    return { processed, updated, errors };
  } catch (error: any) {
    console.error('💥 Failed to update subscription statuses:', {
      error: error.message,
      processed,
      updated,
      errors,
    });
    
    throw error;
  }
};

// Handle expired subscriptions
const handleExpiredSubscriptions = async () => {
  try {
    console.log('⏰ Handling expired subscriptions...');
    
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: {
          lt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    console.log(`📋 Found ${expiredSubscriptions.length} potentially expired subscriptions`);

    for (const subscription of expiredSubscriptions) {
      try {
        if (subscription.stripeSubscriptionId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripeSubscriptionId
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

          console.log(`🚫 Marked subscription ${subscription.id} as cancelled (no Stripe ID)`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to handle expired subscription ${subscription.id}:`, error.message);
      }
    }

    console.log('✅ Expired subscriptions handling completed');
  } catch (error: any) {
    console.error('💥 Failed to handle expired subscriptions:', error.message);
  }
};

// Schedule cron jobs
export const initializeSubscriptionCronJobs = () => {
  // Update subscription statuses every 5 minutes (for testing)
  // Change to '0 * * * *' for every hour in production
  cron.schedule('0 * * * *', updateSubscriptionStatuses);
  
  // Handle expired subscriptions daily at 2 AM
  cron.schedule('0 2 * * *', handleExpiredSubscriptions);

  console.log('✅ Subscription cron jobs initialized');
};

// Export functions for manual execution
export {
  updateSubscriptionStatuses,
  handleExpiredSubscriptions,
  mapStripeStatusToSubscriptionStatus,
};
