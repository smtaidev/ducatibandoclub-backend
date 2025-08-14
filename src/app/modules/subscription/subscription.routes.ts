import express from 'express';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionValidation } from './subscription.validation';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

// Create Stripe Checkout Session (for new subscriptions)
router.post(
  '/create-checkout-session',
  auth(Role.USER),
  validateRequest(SubscriptionValidation.createCheckoutSession),
  SubscriptionController.createCheckoutSession
);

// Create subscription directly (for existing payment methods)
router.post(
  '/',
  auth(Role.USER),
  validateRequest(SubscriptionValidation.createSubscription),
  SubscriptionController.createSubscription
);

// Get current user's subscription
router.get(
  '/',
  auth(Role.USER),
  SubscriptionController.getSubscription
);

// Update subscription
router.patch(
  '/',
  auth(Role.USER),
  validateRequest(SubscriptionValidation.updateSubscription),
  SubscriptionController.updateSubscription
);

// Schedule subscription cancellation (cancel at period end)
router.patch(
  '/cancel-at-period-end',
  auth(Role.USER),
  SubscriptionController.scheduleSubscriptionCancellation
);

// Resume subscription (remove cancellation)
router.patch(
  '/resume',
  auth(Role.USER),
  SubscriptionController.resumeSubscription
);

// Cancel subscription immediately
router.delete(
  '/',
  auth(Role.USER),
  SubscriptionController.cancelSubscription
);

// Stripe webhook endpoint (no auth required)
router.post(
  '/webhook',
  SubscriptionController.handleWebhook
);

export const SubscriptionRoutes = router;
