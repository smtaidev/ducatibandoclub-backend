import { SubscriptionStatus } from '@prisma/client';
import prisma from './src/app/lib/prisma';

// Quick fix function to sync user subscription status with subscription table
const fixUserSubscriptionStatus = async () => {
  try {
    console.log('🔧 Starting fix for user subscription statuses...');

    // Find all users where subscription status doesn't match their actual subscription
    const subscriptionsWithUsers = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.CANCELLED,
      },
      include: {
        user: true,
      },
    });

    console.log(`Found ${subscriptionsWithUsers.length} cancelled subscriptions to check`);

    let fixed = 0;

    for (const subscription of subscriptionsWithUsers) {
      // Check if user's subscription status doesn't match the subscription status
      if (subscription.user.subscriptionStatus !== SubscriptionStatus.CANCELLED) {
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            subscriptionStatus: SubscriptionStatus.CANCELLED,
            isProMember: false,
            membershipEnds: new Date(),
          },
        });

        fixed++;
        console.log(`✅ Fixed user ${subscription.userId}: ${subscription.user.subscriptionStatus} → CANCELLED`);
      }
    }

    console.log(`🎉 Fixed ${fixed} user subscription statuses`);
    return { total: subscriptionsWithUsers.length, fixed };
  } catch (error) {
    console.error('❌ Error fixing user subscription statuses:', error);
    throw error;
  }
};

// Also fix ACTIVE subscriptions where user status doesn't match
const syncAllUserSubscriptionStatuses = async () => {
  try {
    console.log('🔄 Syncing ALL user subscription statuses...');

    const allSubscriptions = await prisma.subscription.findMany({
      include: {
        user: true,
      },
      orderBy: { updatedAt: 'desc' }, // Get most recent subscription per user
    });

    let synced = 0;

    for (const subscription of allSubscriptions) {
      if (subscription.user.subscriptionStatus !== subscription.status) {
        const isActive = subscription.status === SubscriptionStatus.ACTIVE;
        
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            subscriptionStatus: subscription.status,
            isProMember: isActive,
            membershipEnds: isActive ? subscription.currentPeriodEnd : new Date(),
          },
        });

        synced++;
        console.log(`🔄 Synced user ${subscription.userId}: ${subscription.user.subscriptionStatus} → ${subscription.status}`);
      }
    }

    console.log(`✅ Synced ${synced} user subscription statuses`);
    return { total: allSubscriptions.length, synced };
  } catch (error) {
    console.error('❌ Error syncing user subscription statuses:', error);
    throw error;
  }
};

// Run the fix
export { fixUserSubscriptionStatus, syncAllUserSubscriptionStatuses };

// For immediate execution
if (require.main === module) {
  syncAllUserSubscriptionStatuses()
    .then((result) => {
      console.log('Fix completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}
