import cron from 'node-cron';

import stripe from '../lib/stripe';
import { SubscriptionStatus } from '@prisma/client';
import prisma from '../lib/prisma';

// Map Stripe subscription status to our enum
const mapStripeStatusToSubscriptionStatus = (stripeStatus: string): SubscriptionStatus => {
  switch (stripeStatus) {
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

// Check and update subscription statuses every hour
const updateSubscriptionStatuses = async () => {
  try {
    console.log('Starting subscription status update...');
    
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        stripeSubscriptionId: { not: null },
      },
    });

    for (const subscription of activeSubscriptions) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId!
        );

        // Map Stripe status to our enum
        const mappedStatus = mapStripeStatusToSubscriptionStatus(stripeSubscription.status);
        
        // Update subscription if status changed
        if (mappedStatus !== subscription.status) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: mappedStatus,
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
              canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
            },
          });

          // Update user pro status
          const isActive = stripeSubscription.status === 'active';
          await prisma.user.update({
            where: { id: subscription.userId },
            data: {
              isProMember: isActive ? true : false,
              subscriptionStatus: mappedStatus,
              membershipEnds: isActive 
                ? new Date(stripeSubscription.current_period_end * 1000)
                : new Date(),
            },
          });

          console.log(`Updated subscription ${subscription.id} status to ${stripeSubscription.status}`);
        }
      } catch (error: any) {
        console.error(`Failed to update subscription ${subscription.id}:`, error.message);
      }
    }

    console.log('Subscription status update completed');
  } catch (error: any) {
    console.error('Failed to update subscription statuses:', error.message);
  }
};

// Handle expired subscriptions daily
const handleExpiredSubscriptions = async () => {
  try {
    console.log('Handling expired subscriptions...');
    
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

    for (const subscription of expiredSubscriptions) {
      try {
        // Check actual status in Stripe
        if (subscription.stripeSubscriptionId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripeSubscriptionId
          );

          if (stripeSubscription.status !== 'active') {
            // Update subscription status
            const mappedStatus = mapStripeStatusToSubscriptionStatus(stripeSubscription.status);
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: mappedStatus,
              },
            });

            // Update user pro status
            await prisma.user.update({
              where: { id: subscription.userId },
              data: {
                isProMember: false,
                subscriptionStatus: mappedStatus,
                membershipEnds: new Date(),
              },
            });

            console.log(`Handled expired subscription for user ${subscription.userId}`);
          }
        } else {
          // No Stripe subscription ID, mark as cancelled
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: SubscriptionStatus.CANCELLED,
              canceledAt: new Date(),
            },
          });

          await prisma.user.update({
            where: { id: subscription.userId },
            data: {
              isProMember: false,
              subscriptionStatus: SubscriptionStatus.CANCELLED,
              membershipEnds: new Date(),
            },
          });

          console.log(`Marked subscription ${subscription.id} as cancelled (no Stripe ID)`);
        }
      } catch (error: any) {
        console.error(`Failed to handle expired subscription ${subscription.id}:`, error.message);
      }
    }

    console.log('Expired subscriptions handling completed');
  } catch (error: any) {
    console.error('Failed to handle expired subscriptions:', error.message);
  }
};

// Sync with Stripe for data consistency (weekly)
const syncWithStripe = async () => {
  try {
    console.log('Starting Stripe sync...');
    
    const subscriptions = await prisma.subscription.findMany({
      where: {
        stripeSubscriptionId: { not: null },
      },
    });

    for (const subscription of subscriptions) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId!
        );

        // Update all fields from Stripe
        const mappedStatus = mapStripeStatusToSubscriptionStatus(stripeSubscription.status);
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: mappedStatus,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
            stripePriceId: stripeSubscription.items.data[0]?.price.id || subscription.stripePriceId,
          },
        });

        // Update user status
        const isActive = stripeSubscription.status === 'active';
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            isProMember: true,
            subscriptionStatus: mappedStatus,
            membershipEnds: isActive 
              ? new Date(stripeSubscription.current_period_end * 1000)
              : new Date(),
          },
        });

        console.log(`Synced subscription ${subscription.id} with Stripe`);
      } catch (error: any) {
        console.error(`Failed to sync subscription ${subscription.id}:`, error.message);
      }
    }

    console.log('Stripe sync completed');
  } catch (error: any) {
    console.error('Failed to sync with Stripe:', error.message);
  }
};

// Schedule cron jobs
export const initializeSubscriptionCronJobs = () => {
  // Update subscription statuses every hour
  cron.schedule('0 * * * *', updateSubscriptionStatuses);
  
  // Handle expired subscriptions daily at 2 AM
  cron.schedule('0 2 * * *', handleExpiredSubscriptions);
  
  // Sync with Stripe weekly on Sunday at 3 AM
  cron.schedule('0 3 * * 0', syncWithStripe);

  console.log('Subscription cron jobs initialized');
};

// Export functions for manual execution if needed
export {
  updateSubscriptionStatuses,
  handleExpiredSubscriptions,
  syncWithStripe,
};
