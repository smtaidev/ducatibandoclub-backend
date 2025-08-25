// import { SubscriptionStatus, SubscriptionPlanType } from '@prisma/client';
// import Stripe from 'stripe';
// import stripe from './src/app/lib/stripe';
// import prisma from './src/app/lib/prisma';


// const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
//   try {
//     const userId = session.metadata?.userId;
//     if (!userId) {
//       console.error('No userId found in session metadata');
//       return;
//     }

//     // Check if session.subscription exists and is a string
//     if (!session.subscription || typeof session.subscription !== 'string') {
//       console.error('No valid subscription ID found in checkout session');
//       return;
//     }

//     // Retrieve subscription details from Stripe
//     const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);

//     // Validate that we have subscription items
//     if (!stripeSubscription.items?.data?.length) {
//       console.error('No subscription items found in Stripe subscription');
//       return;
//     }

//     const subscriptionItem = stripeSubscription.items.data[0];
//     const price = subscriptionItem.price;

//     // Map price nickname to SubscriptionPlanType enum
//     const getPlanType = (nickname: string | null): SubscriptionPlanType => {
//       if (!nickname) return SubscriptionPlanType.MONTHLY; // Default fallback
      
//       const lowerNickname = nickname.toLowerCase();
//       if (lowerNickname.includes('yearly') || lowerNickname.includes('annual')) {
//         return SubscriptionPlanType.YEARLY;
//       } else if (lowerNickname.includes('trial')) {
//         return SubscriptionPlanType.FREE_TRIAL;
//       }
//       return SubscriptionPlanType.MONTHLY; // Default
//     };

//     // Calculate amount safely
//     const amount = price.unit_amount ? price.unit_amount / 100 : 20.00; // Default to $20 if null

//     // Map Stripe status to our enum
//     const mapStripeStatus = (status: string): SubscriptionStatus => {
//       switch (status) {
//         case 'active':
//           return SubscriptionStatus.ACTIVE;
//         case 'canceled':
//         case 'cancelled':
//           return SubscriptionStatus.CANCELLED;
//         case 'incomplete':
//         case 'incomplete_expired':
//         case 'past_due':
//         case 'unpaid':
//         default:
//           return SubscriptionStatus.INACTIVE;
//       }
//     };

//     // Create the subscription in your DB
//     await prisma.subscription.create({
//       data: {
//         userId: userId,
//         stripeCustomerId: session.customer as string,
//         stripeSubscriptionId: stripeSubscription.id,
//         stripePriceId: price.id,
//         status: mapStripeStatus(stripeSubscription.status),
//         currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
//         currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
//         plan: getPlanType(price.nickname),
//         amount: amount,
//         currency: price.currency || 'usd',
//         startDate: new Date(stripeSubscription.created * 1000),
//         endDate: new Date(stripeSubscription.current_period_end * 1000),
//       },
//     });

//     // Update the user's pro status
//     await prisma.user.update({
//       where: { id: userId },
//       data: {
//         isProMember: stripeSubscription.status === 'active',
//         membershipEnds: new Date(stripeSubscription.current_period_end * 1000),
//       },
//     });

//     console.log(`Successfully processed checkout session for user ${userId}, subscription ${stripeSubscription.id}`);
    
//   } catch (error: any) {
//     console.error('Error in handleCheckoutSessionCompleted:', {
//       error: error.message,
//       stack: error.stack,
//       sessionId: session.id,
//       userId: session.metadata?.userId,
//     });
    
//   }
// };

// export { handleCheckoutSessionCompleted };
