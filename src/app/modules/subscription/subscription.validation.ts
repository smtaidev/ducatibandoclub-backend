import { z } from 'zod';

const createCheckoutSession = z.object({
  body: z.object({
    successUrl: z.string({
      required_error: 'Success URL is required',
    }).url('Must be a valid URL'),
    cancelUrl: z.string({
      required_error: 'Cancel URL is required',
    }).url('Must be a valid URL'),
    priceId: z.string().optional(),
  }),
});

const createSubscription = z.object({
  body: z.object({
    paymentMethodId: z.string().optional(),
    priceId: z.string().optional(),
  }),
});

const updateSubscription = z.object({
  body: z.object({
    cancelAtPeriodEnd: z.boolean().optional(),
    newPriceId: z.string().optional(),
  }),
});

const createBillingPortalSession = z.object({
  body: z.object({
    returnUrl: z.string({
      required_error: 'Return URL is required',
    }).url('Must be a valid URL'),
  }),
});

const subscriptionWebhook = z.object({
  body: z.any(),
  headers: z.object({
    'stripe-signature': z.string({
      required_error: 'Stripe signature is required',
    }),
  }),
});

export const SubscriptionValidation = {
  createCheckoutSession,
  createBillingPortalSession,
  createSubscription,
  updateSubscription,
  subscriptionWebhook,
};
