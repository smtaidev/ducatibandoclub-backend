import { Subscription, SubscriptionStatus, SubscriptionPlanType, User, UserStatus } from '@prisma/client';
import Stripe from 'stripe';
import config from '../../../config';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';
import stripe from '../../lib/stripe';
import prisma from '../../lib/prisma';
import {
  ICheckoutSession,
  ICreateSubscription,
  ISubscriptionResponse,
  IUpdateSubscription,
} from './subscription.interface';

// Create Stripe Checkout Session
const createCheckoutSession = async (
  userId: string,
  data: Omit<ICheckoutSession, 'userId'>
): Promise<{ sessionId: string; url: string }> => {
  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check user status - blocked users cannot create subscriptions
  if (user.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account is blocked. Contact support.');
  }

  // Check if user email is verified
  if (!user.isEmailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please verify your email first');
  }

  // Check if user already has an active subscription
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  console.log('Existing Subscription:- ):- ', existingSubscription);

  if (existingSubscription) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User already has an active subscription');
  }

  try {
    // Create or get Stripe customer
    let stripeCustomerId: string;

    const existingCustomer = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomer.data.length > 0) {
      stripeCustomerId = existingCustomer.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: userId,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: data.priceId || config.stripe.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      metadata: {
        userId: userId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Failed to create checkout session: ${error.message}`);
  }
};

// Create subscription directly (for existing payment methods)
const createSubscription = async (
  userId: string,
  data: Omit<ICreateSubscription, 'userId'>
): Promise<ISubscriptionResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check user status - blocked users cannot create subscriptions
  if (user.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account is blocked. Contact support.');
  }

  // Check if user email is verified
  if (!user.isEmailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please verify your email first');
  }

  // Check if user already has an active subscription
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  if (existingSubscription) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User already has an active subscription');
  }

  try {
    // Create or get Stripe customer
    let stripeCustomerId: string;

    const existingCustomer = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomer.data.length > 0) {
      stripeCustomerId = existingCustomer.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: userId,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Attach payment method if provided
    if (data.paymentMethodId) {
      await stripe.paymentMethods.attach(data.paymentMethodId, {
        customer: stripeCustomerId,
      });

      // Set as default payment method
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: data.paymentMethodId,
        },
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: data.priceId || config.stripe.priceId,
        },
      ],
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        userId: userId,
      },
    });

    // Save subscription to database
    await prisma.subscription.create({
      data: {
        userId,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: data.priceId || config.stripe.priceId,
        status: subscription.status as SubscriptionStatus,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        startDate: new Date(subscription.start_date! * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
      },
    });

    // Update user pro status
    await prisma.user.update({
      where: { id: userId },
      data: {
        isProMember: true,
        membershipEnds: new Date(subscription.current_period_end * 1000),
      },
    });

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      clientSecret: subscription.latest_invoice
        ? (subscription.latest_invoice as Stripe.Invoice).payment_intent
          ? ((subscription.latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent).client_secret ||
            undefined
          : undefined
        : undefined,
    };
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Failed to create subscription: ${error.message}`);
  }
};

// Get user's subscription
const getSubscription = async (userId: string): Promise<Subscription | null> => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return subscription;
};

// Update subscription
const updateSubscription = async (userId: string, data: IUpdateSubscription): Promise<ISubscriptionResponse> => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: SubscriptionStatus.ACTIVE },
  });

  if (!subscription || !subscription.stripeSubscriptionId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Active subscription not found');
  }

  try {
    let updatedSubscription: Stripe.Subscription;

    if (data.cancelAtPeriodEnd !== undefined) {
      // Update cancellation status
      updatedSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: data.cancelAtPeriodEnd,
      });

      // Update database
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          canceledAt: data.cancelAtPeriodEnd ? new Date() : null,
        },
      });
    } else if (data.newPriceId) {
      // Update subscription price
      updatedSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [
          {
            id: (await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)).items.data[0].id,
            price: data.newPriceId,
          },
        ],
      });

      // Update database
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          stripePriceId: data.newPriceId,
        },
      });
    } else {
      updatedSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    }

    return {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
    };
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Failed to update subscription: ${error.message}`);
  }
};

// Cancel subscription immediately
const cancelSubscription = async (userId: string): Promise<void> => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: SubscriptionStatus.ACTIVE },
  });

  if (!subscription || !subscription.stripeSubscriptionId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Active subscription not found');
  }

  try {
    // Cancel subscription in Stripe
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    // Update database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        canceledAt: new Date(),
      },
    });

    // Update user pro status
    await prisma.user.update({
      where: { id: userId },
      data: {
        isProMember: false,
        subscriptionStatus: SubscriptionStatus.CANCELLED,
        membershipEnds: new Date(), 
      },
    });
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Failed to cancel subscription: ${error.message}`);
  }
};

// Handle Stripe webhooks
const handleWebhook = async (payload: string | Buffer, signature: string): Promise<void> => {
  let event: Stripe.Event;

  // console.log(`Received event: >>>>>>>>>>>>>>>>>>>>>>>>`);
  // console.log(`Received event: ${JSON.stringify(payload)}`);
  // console.log(`Signature: ${signature}`);

  try {
    event = stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret!);
    // console.log(event, 'event:-');
    // console.log(`Received event: >>>>>>>>>>>>>>>>>>>>>>>> hello: ${event.type}`);
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Webhook signature verification failed: ${error.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
  try {
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error('No userId found in session metadata');
      return;
    }

    // Check if session.subscription exists and is a string
    if (!session.subscription || typeof session.subscription !== 'string') {
      console.error('No valid subscription ID found in checkout session');
      return;
    }

    // Retrieve subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);

    // Validate that we have subscription items
    if (!stripeSubscription.items?.data?.length) {
      console.error('No subscription items found in Stripe subscription');
      return;
    }

    const subscriptionItem = stripeSubscription.items.data[0];
    const price = subscriptionItem.price;

    // Map price nickname to SubscriptionPlanType enum
    const getPlanType = (nickname: string | null): SubscriptionPlanType => {
      if (!nickname) return SubscriptionPlanType.MONTHLY; // Default fallback

      const lowerNickname = nickname.toLowerCase();
      if (lowerNickname.includes('yearly') || lowerNickname.includes('annual')) {
        return SubscriptionPlanType.YEARLY;
      } else if (lowerNickname.includes('trial')) {
        return SubscriptionPlanType.FREE_TRIAL;
      }
      return SubscriptionPlanType.MONTHLY; // Default
    };

    // Calculate amount safely
    const amount = price.unit_amount ? price.unit_amount / 100 : 20.0; // Default to $20 if null

    // Map Stripe status to our enum
    const mapStripeStatus = (status: string): SubscriptionStatus => {
      switch (status) {
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

    // Create the subscription in your DB
    await prisma.subscription.create({
      data: {
        userId: userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: price.id,
        status: mapStripeStatus(stripeSubscription.status),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        plan: getPlanType(price.nickname),
        amount: amount,
        currency: price.currency || 'usd',
        startDate: new Date(stripeSubscription.created * 1000),
        endDate: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    // Update the user's pro status
    await prisma.user.update({
      where: { id: userId },
      data: {
        isProMember: true,
        subscriptionStatus: mapStripeStatus(stripeSubscription.status), 
        membershipEnds: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    // console.log(`Successfully processed checkout session for user ${userId}, subscription ${stripeSubscription.id}`);
  } catch (error: any) {
    console.error('Error in handleCheckoutSessionCompleted:', {
      error: error.message,
      stack: error.stack,
      sessionId: session.id,
      userId: session.metadata?.userId,
    });
  }
};

const handleSubscriptionCreated = async (subscription: Stripe.Subscription): Promise<void> => {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    create: {
      userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status as SubscriptionStatus,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      startDate: new Date(subscription.start_date! * 1000),
      endDate: new Date(subscription.current_period_end * 1000),
    },
    update: {
      status: subscription.status as SubscriptionStatus,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
};

const handleSubscriptionUpdated = async (subscription: Stripe.Subscription): Promise<void> => {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: subscription.status as SubscriptionStatus,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  });

  // Update user pro status
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { user: true },
  });

  if (dbSubscription) {
    const isActive = subscription.status === 'active';
    await prisma.user.update({
      where: { id: dbSubscription.userId },
      data: {
        isProMember: isActive,
        membershipEnds: isActive ? new Date(subscription.current_period_end * 1000) : new Date(),
      },
    });
  }
};

const handleSubscriptionDeleted = async (subscription: Stripe.Subscription): Promise<void> => {

  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: SubscriptionStatus.CANCELLED,
      canceledAt: new Date(),
    },
  });
  
  // Update user pro status
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });
  
  if (dbSubscription) {
    await prisma.user.update({
      where: { id: dbSubscription.userId },
      data: {
        isProMember: false,
        subscriptionStatus: SubscriptionStatus.CANCELLED,
        membershipEnds: new Date(),
      },
    });
  }
};

const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice): Promise<void> => {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      status: subscription.status as SubscriptionStatus,
    },
  });

  // Update user membership
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (dbSubscription) {
    await prisma.user.update({
      where: { id: dbSubscription.userId },
      data: {
        isProMember: true,
        membershipEnds: new Date(subscription.current_period_end * 1000),
      },
    });
  }
};

const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice): Promise<void> => {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

  // If payment fails and subscription becomes past_due or unpaid
  if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: subscription.status as SubscriptionStatus },
    });

    // Optionally keep pro status for a grace period or remove immediately
    // For now, we'll remove it immediately
    const dbSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (dbSubscription) {
      await prisma.user.update({
        where: { id: dbSubscription.userId },
        data: {
          isProMember: false,
        },
      });
    }
  }
};

export const SubscriptionService = {
  createCheckoutSession,
  createSubscription,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  handleWebhook,
};
