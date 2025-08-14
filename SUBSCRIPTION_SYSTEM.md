# MADARA Subscription System

A comprehensive Stripe-integrated subscription system that allows users to subscribe to a $20/month plan with the ability to cancel anytime.

## Features

- **Single Price Plan**: $20/month flat rate with no hidden fees
- **Easy Cancellation**: Users can cancel anytime - either immediately or at the end of the billing period
- **Stripe Integration**: Secure payment processing with Stripe
- **Webhook Support**: Real-time subscription status updates
- **Automatic Status Management**: Cron jobs for subscription status sync
- **Pro Member Features**: Automatic pro status management based on subscription

## API Endpoints

### Base URL: `/api/v1/subscription`

### 1. Create Checkout Session
**POST** `/create-checkout-session`

Creates a Stripe Checkout Session for new subscriptions.

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel",
  "priceId": "price_optional_custom_price_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Checkout session created successfully",
  "data": {
    "sessionId": "cs_test_xxx",
    "url": "https://checkout.stripe.com/pay/cs_test_xxx"
  }
}
```

### 2. Create Subscription Directly
**POST** `/`

Creates a subscription using an existing payment method.

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "paymentMethodId": "pm_1234567890",
  "priceId": "price_optional_custom_price_id"
}
```

### 3. Get User's Subscription
**GET** `/`

Retrieves the current user's subscription details.

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "success": true,
  "message": "Subscription retrieved successfully",
  "data": {
    "id": "sub_1234567890",
    "status": "active",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "cancelAtPeriodEnd": false,
    "amount": 20.00,
    "currency": "usd"
  }
}
```

### 4. Schedule Cancellation (Cancel at Period End)
**PATCH** `/cancel-at-period-end`

Schedules the subscription to cancel at the end of the current billing period.

**Headers:**
- `Authorization: Bearer <jwt_token>`

### 5. Resume Subscription
**PATCH** `/resume`

Removes the scheduled cancellation, allowing the subscription to continue.

**Headers:**
- `Authorization: Bearer <jwt_token>`

### 6. Cancel Subscription Immediately
**DELETE** `/`

Cancels the subscription immediately.

**Headers:**
- `Authorization: Bearer <jwt_token>`

### 7. Stripe Webhook
**POST** `/webhook`

Handles Stripe webhook events for real-time subscription updates.

**Headers:**
- `stripe-signature: <stripe_webhook_signature>`

## Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_monthly_price_id
```

## Setup Instructions

### 1. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Go to Dashboard → Developers → API Keys
3. Copy your Publishable and Secret keys
4. Create a product with a $20/month recurring price
5. Copy the price ID (starts with `price_`)

### 2. Webhook Setup

1. Go to Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/v1/subscription/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret

### 3. Database Migration

Run the Prisma migration to update your database schema:

```bash
npx prisma db push
```

### 4. Frontend Integration

#### Create Checkout Session (React Example)

```javascript
const handleSubscribe = async () => {
  try {
    const response = await fetch('/api/v1/subscription/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription/cancel`
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Redirect to Stripe Checkout
      window.location.href = data.data.url;
    }
  } catch (error) {
    console.error('Error creating subscription:', error);
  }
};
```

#### Check Subscription Status

```javascript
const checkSubscriptionStatus = async () => {
  try {
    const response = await fetch('/api/v1/subscription', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.success && data.data) {
      // User has an active subscription
      setIsProMember(data.data.status === 'active');
      setSubscription(data.data);
    }
  } catch (error) {
    console.error('Error checking subscription:', error);
  }
};
```

#### Cancel Subscription

```javascript
const cancelSubscription = async (immediately = false) => {
  try {
    const url = immediately 
      ? '/api/v1/subscription'
      : '/api/v1/subscription/cancel-at-period-end';
    
    const response = await fetch(url, {
      method: immediately ? 'DELETE' : 'PATCH',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(immediately 
        ? 'Subscription cancelled immediately' 
        : 'Subscription will cancel at the end of the billing period'
      );
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
  }
};
```

## Subscription Status Types

- `active`: Subscription is active and user has access to pro features
- `inactive`: Subscription is not active
- `cancelled`: Subscription has been cancelled
- `past_due`: Payment failed, subscription may be suspended
- `unpaid`: Multiple payment failures, subscription suspended

## Automatic Features

### Cron Jobs

The system includes automatic cron jobs that run:

1. **Every Hour**: Update subscription statuses from Stripe
2. **Daily at 2 AM**: Handle expired subscriptions
3. **Weekly on Sunday at 3 AM**: Full sync with Stripe for data consistency

### User Status Management

- When subscription becomes active: `user.isProMember = true`
- When subscription is cancelled/expired: `user.isProMember = false`
- `user.membershipEnds` is updated with the subscription end date

## Testing

### Test Mode

Use Stripe's test mode for development:

- Test card: 4242 4242 4242 4242
- Any future expiry date
- Any CVC

### Test Webhooks

Use Stripe CLI to forward webhooks to your local development:

```bash
stripe listen --forward-to localhost:8601/api/v1/subscription/webhook
```

## Error Handling

The system includes comprehensive error handling for:

- Invalid payment methods
- Failed payments
- Webhook signature verification
- Stripe API errors
- Database errors

## Security Features

- JWT authentication for all user endpoints
- Webhook signature verification
- Raw body parsing for webhook security
- Input validation with Zod schemas

## Support

For subscription-related issues:

1. Check the user's subscription status in the database
2. Verify webhook delivery in Stripe Dashboard
3. Check server logs for error messages
4. Use Stripe Dashboard to manually manage subscriptions if needed

## Pro Member Access Control

To restrict features to pro members only, use this pattern in your controllers:

```typescript
// Check if user is pro member
const user = await prisma.user.findUnique({
  where: { id: req.user.userId }
});

if (!user?.isProMember) {
  throw new ApiError(
    httpStatus.FORBIDDEN, 
    'This feature requires a pro subscription'
  );
}
```

This subscription system provides a robust, scalable solution for managing recurring subscriptions with Stripe while maintaining data consistency and providing excellent user experience.
