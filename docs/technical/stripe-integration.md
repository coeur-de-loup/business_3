# Stripe Payment Integration

**Date:** January 9, 2026
**Status:** ✅ Implemented
**Environment:** Test Mode (No real money)

---

## Overview

This document describes the Stripe payment integration for the SMB AI Orchestration Platform. The integration uses **Stripe Test Mode** exclusively for development - no real payments are processed.

## Features Implemented

### ✅ Completed Features

1. **Subscription Checkout**
   - Stripe Checkout for new subscriptions
   - Three pricing tiers: Starter ($49), Professional ($99), Enterprise ($299)
   - 14-day free trial for all plans
   - Test card payment processing

2. **Billing Management**
   - Stripe Customer Portal for self-service management
   - Update payment methods
   - View invoices
   - Cancel subscriptions
   - Update billing information

3. **Webhook Handlers**
   - `checkout.session.completed` - New subscription created
   - `customer.subscription.created` - Subscription activation
   - `customer.subscription.updated` - Plan changes, cancellations
   - `customer.subscription.deleted` - Subscription cancelled
   - `invoice.paid` - Payment succeeded
   - `invoice.payment_failed` - Payment failed

4. **Database Integration**
   - Organization → Stripe Customer mapping
   - Subscription tracking in database
   - Plan and status synchronization
   - Usage tracking (workflows, integrations, users)

5. **Billing UI**
   - Current subscription status display
   - Usage vs. limits visualization
   - Plan comparison and upgrade flow
   - Billing portal access

---

## Architecture

### Frontend (Next.js)
```
/billing
├── page.tsx                    # Billing page with pricing cards
└── components/
    ├── pricing-card.tsx         # Individual plan display
    └── subscription-status-badge.tsx
```

### Backend (Next.js API Routes)
```
/api/v1/billing/
├── checkout/route.ts           # Create checkout session
├── portal/route.ts             # Create billing portal session
└── status/route.ts             # Get current billing status

/api/v1/stripe/
└── webhook/route.ts            # Stripe webhook handler
```

### Library
```
lib/stripe.ts                   # Stripe client and helper functions
```

### Database (Prisma)
```prisma
model Organization {
  stripeCustomerId  String?
  plan              Plan
  subscriptions     Subscription[]
}

model Subscription {
  stripeSubscriptionId     String    @unique
  stripePriceId            String?
  stripeCurrentPeriodEnd   DateTime
  plan                     Plan
  status                   SubscriptionStatus
  amount                   Float
  currency                 String
  billingInterval          BillingInterval
  trialStart               DateTime?
  trialEnd                 DateTime?
  cancelAtPeriodEnd        Boolean?
}
```

---

## Setup Instructions

### 1. Stripe Account Setup

**Get Stripe Test Keys (Free):**

1. Go to https://dashboard.stripe.com/register
2. Create an account (no credit card required for test mode)
3. Navigate to: **Developers** → **API keys**
4. Copy the **Test mode** keys:
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`

### 2. Create Products and Prices

**Option A: Use Stripe Dashboard (Recommended)**

1. Go to: **Products** → **Add product**
2. Create three products:

**Starter Plan:**
- Name: `Starter Plan`
- Price: `$49 USD/month`
- Recurring: Monthly

**Professional Plan:**
- Name: `Professional Plan`
- Price: `$99 USD/month`
- Recurring: Monthly

**Enterprise Plan:**
- Name: `Enterprise Plan`
- Price: `$299 USD/month`
- Recurring: Monthly

3. Copy the Price IDs (looks like `price_1234...`) for each plan

**Option B: Use Stripe CLI**

```bash
# Create Starter Plan price
stripe prices create \
  --unit-amount 4900 \
  --currency usd \
  --recurring-interval month \
  --product-data.name="Starter Plan"

# Create Professional Plan price
stripe prices create \
  --unit-amount 9900 \
  --currency usd \
  --recurring-interval month \
  --product-data.name="Professional Plan"

# Create Enterprise Plan price
stripe prices create \
  --unit-amount 29900 \
  --currency usd \
  --recurring-interval month \
  --product-data.name="Enterprise Plan"
```

### 3. Set Webhook Endpoint

**Option A: Use Stripe CLI (Recommended for Local Development)**

```bash
# Install Stripe CLI
# Mac: brew install stripe/stripe-cli/stripe
# Linux: curl -s https://packages.stripe.com/api/security/keys/1.1/... | sh

# Login to Stripe
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook

# This gives you a webhook secret (whsec_...)
# Copy this to STRIPE_WEBHOOK_SECRET
```

**Option B: Use ngrok (Alternative)**

```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel
ngrok http 3000

# Use the https URL (e.g., https://abc123.ngrok.io)
# Add webhook in Stripe Dashboard:
# https://dashboard.stripe.com/webhooks
# Endpoint: https://abc123.ngrok.io/api/v1/stripe/webhook
```

### 4. Configure Environment Variables

Add to `.env.local`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Price IDs (from Step 2)
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

### 5. Update Pricing Configuration

Edit `src/lib/stripe.ts` and add the Price IDs:

```typescript
export const PRICING_PLANS = {
  STARTER: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_YOUR_STARTER_ID',
    // ...
  },
  PROFESSIONAL: {
    name: 'Professional',
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_YOUR_PROFESSIONAL_ID',
    // ...
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_YOUR_ENTERPRISE_ID',
    // ...
  },
};
```

### 6. Run Database Migrations

```bash
cd app
pnpm prisma:generate
pnpm db:push
```

### 7. Start Development Server

```bash
pnpm dev
```

---

## Testing

### Test Cards (Stripe Test Mode)

Use these cards to test different scenarios:

| Card Number | Description | CVC | Expiry |
|-------------|-------------|-----|--------|
| `4242 4242 4242 4242` | Default | Any 3 digits | Any future date |
| `4000 0000 0000 0002` | Card declined | Any 3 digits | Any future date |
| `4000 0000 0000 9995` | Insufficient funds | Any 3 digits | Any future date |
| `4000 0025 0000 3155` | Require 3DS | Any 3 digits | Any future date |

### Test Scenarios

**1. Successful Subscription**
```
1. Navigate to /billing
2. Click "Subscribe" on any plan
3. Enter test card: 4242 4242 4242 4242
4. Complete checkout
5. Verify: Subscription created in database
6. Verify: Organization plan updated
```

**2. Failed Payment**
```
1. Navigate to /billing
2. Click "Subscribe"
3. Enter test card: 4000 0000 0000 0002 (declined)
4. Verify: Error message displayed
5. Verify: No subscription created
```

**3. Upgrade Plan**
```
1. Start with Starter plan
2. Navigate to /billing
3. Click "Subscribe" on Professional plan
4. Complete checkout
5. Verify: Plan upgraded in database
```

**4. Cancel Subscription**
```
1. Navigate to /billing
2. Click "Manage Billing"
3. In Stripe portal, click "Cancel subscription"
4. Confirm cancellation
5. Verify: Subscription marked as cancelled
6. Verify: Plan downgraded to STARTER
```

**5. Webhook Events**
```bash
# With Stripe CLI running, trigger test events:
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.paid
stripe trigger invoice.payment_failed

# Check logs for webhook handler output
```

---

## API Endpoints Reference

### POST /api/v1/billing/checkout
Creates a Stripe checkout session for new subscriptions.

**Request:**
```json
{
  "plan": "PROFESSIONAL"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

### POST /api/v1/billing/portal
Creates a Stripe billing portal session.

**Response:**
```json
{
  "portalUrl": "https://billing.stripe.com/..."
}
```

### GET /api/v1/billing/status
Returns current billing status for organization.

**Response:**
```json
{
  "organization": {
    "id": "...",
    "name": "Acme Corp",
    "plan": "PROFESSIONAL"
  },
  "subscription": {
    "status": "ACTIVE",
    "amount": 9900,
    "currentPeriodEnd": "2026-02-09T00:00:00.000Z"
  },
  "usage": {
    "workflows": 5,
    "integrations": 3,
    "users": 2
  },
  "limits": {
    "workflows": 25,
    "integrations": 10,
    "users": -1
  }
}
```

### POST /api/v1/stripe/webhook
Handles Stripe webhook events. Requires signature verification.

**Headers:**
```
stripe-signature: t=...,v1=...
```

**Events Handled:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

## Security Considerations

### ✅ Implemented Security

1. **Webhook Signature Verification**
   - All webhooks verified using `stripe-webhook-secret`
   - Prevents fake webhook events

2. **Environment Variables**
   - Secret keys never exposed to frontend
   - `STRIPE_SECRET_KEY` server-side only
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` client-safe

3. **User Authentication**
   - All billing endpoints require valid session
   - Users can only access their own billing data

4. **Database Validation**
   - Organization ID validation on all requests
   - Customer ID verification before subscription access

### ⚠️ Production Deployment (Not Yet Implemented)

Before deploying to production with real payments:

1. **Switch to Live Mode**
   - Replace test keys with live keys (`sk_live_...`, `pk_live_...`)
   - Create real products and prices in live mode
   - Update webhook endpoint to production URL

2. **HTTPS Required**
   - Stripe requires HTTPS for live mode
   - Use Vercel, Cloudflare, or similar

3. **Error Monitoring**
   - Set up Sentry for payment errors
   - Monitor failed payments and webhooks
   - Alert on revenue-impacting issues

4. **Idempotency Keys**
   - Add idempotency keys to all Stripe API calls
   - Prevent duplicate charges on retries

5. **Rate Limiting**
   - Implement rate limiting on checkout endpoints
   - Prevent abuse of trial periods

6. **Tax Calculation**
   - Integrate Stripe Tax for automated tax calculation
   - Handle EU VAT, US sales tax, etc.

---

## Troubleshooting

### Issue: "No price ID configured for plan"

**Solution:**
- Ensure `STRIPE_STARTER_PRICE_ID` etc. are set in `.env.local`
- Create products in Stripe Dashboard and copy Price IDs
- Update `src/lib/stripe.ts` with correct Price IDs

### Issue: "Webhook signature verification failed"

**Solution:**
- Ensure `STRIPE_WEBHOOK_SECRET` is set in `.env.local`
- Get webhook secret from Stripe CLI: `stripe listen --print-secret`
- Or from Stripe Dashboard → Webhooks → Select endpoint → Click "Reveal"

### Issue: "No Stripe customer found"

**Solution:**
- Complete at least one checkout session first
- Customer is created during `checkout.session.completed`
- Check database `organizations` table for `stripeCustomerId`

### Issue: Webhook not firing

**Solution:**
- Ensure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/v1/stripe/webhook`
- Check webhook endpoint is registered in Stripe Dashboard
- Verify webhook URL is accessible (no firewall blocking)

### Issue: Payment succeeds but database not updated

**Solution:**
- Check webhook logs for errors
- Verify Prisma database connection
- Check webhook handler console output
- Ensure `STRIPE_WEBHOOK_SECRET` matches

---

## Cost Analysis

### Development (Test Mode)
- **Stripe:** $0 (test mode is free)
- **Total:** $0/month

### Production (Estimated)
- **Stripe Processing Fee:** 2.9% + $0.30 per transaction
- **Example:** $49 subscription → $1.72 fee (3.5%)
- **Example:** $99 subscription → $3.17 fee (3.2%)
- **Example:** $299 subscription → $9.02 fee (3.0%)

### For 500 Customers:
- **Total Stripe Fees:** ~$1,000/month
- **Effective Rate:** ~3.2% of revenue

---

## Future Enhancements

### Phase 2 Features (Not Yet Implemented)

1. **Annual Billing**
   - Add yearly pricing option
   - 20% discount for annual plans
   - Prorated upgrades/downgrades

2. **Multiple Subscriptions**
   - Allow add-ons (e.g., extra workflows)
   - Per-seat pricing for large teams
   - Usage-based billing for AI tokens

3. **Coupons and Discounts**
   - Promo codes for marketing campaigns
   - Lifetime discounts for early adopters
   - Referral program credits

4. **Advanced Features**
   - Metered billing (pay per workflow execution)
   - Tiered pricing (usage-based)
   - Multi-currency support
   - Connect (for marketplace features)

5. **Revenue Recovery**
   - Smart retry logic for failed payments
   - Dunning emails (payment reminders)
   - Automatic card updater

---

## References

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Next.js Stripe Integration Guide](https://stripe.com/docs/payments/quickstart)
- [Prisma Stripe Schema](https://www.prisma.io/docs/guides/database/strategies/multi-tenancy#stripe-based-saas)

---

## Status

✅ **Implementation Complete** (January 9, 2026)

All core payment and billing features have been implemented and are ready for testing in Stripe Test Mode.

**Next Steps:**
1. Test all payment flows with Stripe CLI
2. Create Stripe products and copy Price IDs
3. Configure environment variables
4. Test webhooks end-to-end
5. Document any bugs or edge cases

**Before Production:**
1. Switch to Stripe live mode
2. Set up production webhook endpoint
3. Enable error monitoring (Sentry)
4. Add idempotency keys
5. Implement tax calculation (Stripe Tax)
6. Set up revenue recovery (dunning emails)

---

**Document maintained by:** Development Team
**Last updated:** January 9, 2026
