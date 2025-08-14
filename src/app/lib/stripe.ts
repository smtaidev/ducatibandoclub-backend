import Stripe from 'stripe';
import config from '../../config';

if (!config.stripe.secretKey) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-02-24.acacia',
});

export default stripe;
