# MADARA Backend - Postman API Collections

This directory contains comprehensive Postman collections and environments for testing all MADARA Backend API endpoints.

## 📁 Files Included

### Collections
- `MADARA_Backend_Complete.postman_collection.json` - Complete API collection with all endpoints

### Environments
- `MADARA_Development.postman_environment.json` - Development environment (localhost:5000)
- `MADARA_Production.postman_environment.json` - Production environment template

## 🚀 Quick Setup

### 1. Import Collections and Environments
1. Open Postman
2. Click **Import** → **Upload Files**
3. Import all three files from this directory
4. Select the appropriate environment (Development/Production)

### 2. Environment Configuration
Update the environment variables with your actual values:

#### Development Environment
- `base_url`: `http://localhost:5000` (default)
- `stripe_price_id`: Your Stripe price ID for the $20/month plan
- `stripe_webhook_secret`: Your Stripe webhook secret for development

#### Production Environment  
- `base_url`: Your production domain (e.g., `https://api.madara.com`)
- `stripe_price_id`: Your live Stripe price ID
- `stripe_webhook_secret`: Your live Stripe webhook secret

## 📋 API Endpoints Overview

### 🔐 Authentication
- **POST** `/auth/register` - Register new user
- **POST** `/auth/login` - User login
- **POST** `/auth/logout` - User logout
- **POST** `/auth/refresh-tokens` - Refresh access tokens
- **POST** `/auth/forgot-password` - Request password reset
- **POST** `/auth/reset-password` - Reset password with token
- **POST** `/auth/send-verification-email` - Send email verification
- **POST** `/auth/verify-email` - Verify email address

### 👥 Users Management
- **GET** `/users` - Get all users (Admin only)
- **GET** `/users/:id` - Get user by ID
- **PATCH** `/users/:id` - Update user
- **DELETE** `/users/:id` - Delete user

### 📊 Investment Strategy
- **POST** `/strategy` - Create investment strategy
- **GET** `/strategy/user-strategy` - Get user's strategy
- **GET** `/strategy/ai-suggestions` - Get AI stock recommendations

### 💳 Subscriptions (Stripe Integration)
- **POST** `/subscriptions` - Create new subscription
- **GET** `/subscriptions/user` - Get user's subscription
- **GET** `/subscriptions` - Get all subscriptions (Admin)
- **POST** `/subscriptions/cancel` - Cancel subscription
- **POST** `/subscriptions/resume` - Resume cancelled subscription
- **PUT** `/subscriptions/payment-method` - Update payment method
- **GET** `/subscriptions/:id` - Get subscription by ID (Admin)

### 🔗 Webhooks
- **POST** `/subscriptions/webhook` - Stripe webhook handler

### ❤️ Health Check
- **GET** `/health` - API health check

## 🔄 Authentication Flow

### Automatic Token Management
The collection includes automated scripts that:
1. Extract tokens from login/register responses
2. Store them in environment variables
3. Use them automatically in subsequent requests

### Manual Token Setup
If needed, you can manually set tokens:
1. Login or register using the auth endpoints
2. Copy the `access_token` from the response
3. Set it in your environment variables
4. The collection will use it automatically

## 🧪 Testing Workflow

### 1. Start with Authentication
```
1. Register User → Creates account and sets tokens
2. Login User → Gets tokens for existing account
```

### 2. Create Investment Profile
```
1. Create Investment Strategy → Set user preferences
2. Get User Strategy → Verify saved strategy
3. Get AI Stock Suggestions → Get personalized recommendations
```

### 3. Subscription Management
```
1. Create Subscription → Subscribe to $20/month plan
2. Get User Subscription → Check subscription status
3. Update Payment Method → Change payment method
4. Cancel Subscription → Cancel at period end
5. Resume Subscription → Reactivate cancelled subscription
```

### 4. Admin Operations (Requires Admin Role)
```
1. Get All Users → View all registered users
2. Get All Subscriptions → View all subscriptions
3. Get Subscription by ID → View specific subscription
```

## 📝 Request Examples

### Investment Strategy Creation
```json
{
    "investmentFocus": [
        "Technology & Innovation",
        "Healthcare & Bio",
        "Finance & Money"
    ],
    "riskTolerance": "Balanced",
    "preferredTimeframe": "Long-Term"
}
```

### Subscription Creation
```json
{
    "paymentMethodId": "pm_card_visa",
    "priceId": "{{stripe_price_id}}"
}
```

### User Registration
```json
{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
}
```

## 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:5000` |
| `access_token` | JWT access token | Auto-populated |
| `refresh_token` | JWT refresh token | Auto-populated |
| `user_id` | Current user ID | Auto-populated |
| `stripe_price_id` | Stripe price ID | `price_1234567890abcdef` |
| `stripe_webhook_secret` | Webhook secret | `whsec_test_...` |

## 🚨 Important Notes

### Security
- Never commit actual tokens or secrets to version control
- Use test Stripe keys in development
- Webhook signatures are required for webhook endpoints

### Rate Limiting
- Authentication endpoints may have rate limiting
- Wait between requests if you encounter 429 errors

### Error Handling
- All endpoints return consistent error responses
- Check response status codes and messages
- Tokens auto-refresh on 401 errors

### Subscription Testing
- Use Stripe test cards for development
- Test card: `4242424242424242`
- Webhook testing requires ngrok or similar tools

## 🔗 Stripe Integration Testing

### Test Cards
```
Success: 4242424242424242
Declined: 4000000000000002
3D Secure: 4000000000003220
```

### Webhook Testing with ngrok
1. Install ngrok: `npm install -g ngrok`
2. Expose local server: `ngrok http 5000`
3. Update Stripe webhook URL to: `https://your-ngrok-url.ngrok.io/api/v1/subscriptions/webhook`
4. Test webhook events in Stripe Dashboard

## 📞 Support

For API issues or questions:
1. Check server logs for errors
2. Verify environment variables are set correctly
3. Ensure your backend server is running
4. Check Stripe configuration for subscription issues

## 🎯 Next Steps

1. **Import** all Postman files
2. **Configure** environment variables
3. **Start** your backend server (`npm run dev`)
4. **Test** authentication flow
5. **Create** investment strategies
6. **Test** subscription flows
7. **Verify** webhook handling

Happy testing! 🚀
