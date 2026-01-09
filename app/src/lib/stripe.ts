/**
 * Stripe Client Configuration
 *
 * This module provides a configured Stripe client for payment processing.
 * Uses Stripe Test Mode for development - no real money is charged.
 *
 * Test Cards: https://stripe.com/docs/testing
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key from environment
// In test mode, this uses test keys (sk_test_*)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover' as any,
  typescript: true,
});

// Pricing configuration for our three tiers
export const PRICING_PLANS = {
  STARTER: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || '', // Will be set after creating products in Stripe
    amount: 4900, // $49.00 in cents
    currency: 'USD',
    interval: 'month' as const,
    features: [
      '5 workflows',
      '3 integrations',
      '2 users',
      '50 templates',
      'Email support',
    ],
  },
  PROFESSIONAL: {
    name: 'Professional',
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || '',
    amount: 9900, // $99.00 in cents
    currency: 'USD',
    interval: 'month' as const,
    features: [
      '25 workflows',
      '10 integrations',
      'Unlimited users',
      '150+ templates',
      'Custom workflows',
      'Priority support',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    amount: 29900, // $299.00 in cents
    currency: 'USD',
    interval: 'month' as const,
    features: [
      'Unlimited workflows',
      'Unlimited integrations',
      'Unlimited users',
      'All templates',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
} as const;

/**
 * Create a Stripe checkout session for new subscriptions
 */
export async function createCheckoutSession(params: {
  organizationId: string;
  plan: keyof typeof PRICING_PLANS;
  successUrl: string;
  cancelUrl: string;
  userEmail?: string;
}) {
  const { organizationId, plan, successUrl, cancelUrl, userEmail } = params;
  const priceId = PRICING_PLANS[plan].priceId;

  if (!priceId) {
    throw new Error(`No price ID configured for plan: ${plan}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: organizationId,
    customer_email: userEmail,
    metadata: {
      organizationId,
      plan,
    },
    subscription_data: {
      metadata: {
        organizationId,
        plan,
      },
      trial_period_days: 14, // 14-day free trial
    },
  });

  return session;
}

/**
 * Create a Stripe customer for an organization
 */
export async function createCustomer(params: {
  organizationId: string;
  email: string;
  name: string;
}) {
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      organizationId: params.organizationId,
    },
  });

  return customer;
}

/**
 * Retrieve a Stripe customer
 */
export async function getCustomer(customerId: string) {
  return await stripe.customers.retrieve(customerId);
}

/**
 * Create a portal session for managing subscriptions
 */
export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return session;
}

/**
 * Retrieve a subscription
 */
export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel a subscription at the end of the current period
 */
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume a cancelled subscription
 */
export async function resumeSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  if (!subscription.cancel_at_period_end) {
    throw new Error('Subscription is not scheduled for cancellation');
  }

  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update subscription quantity (for per-seat pricing)
 * Not used in our flat-rate pricing but available for future
 */
export async function updateSubscriptionQuantity(
  subscriptionId: string,
  quantity: number
) {
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0]
          .id,
        quantity,
      },
    ],
  });
}

/**
 * Get upcoming invoice for a subscription
 */
export async function getUpcomingInvoice(subscriptionId: string) {
  return await stripe.invoices.retrieveUpcoming({
    subscription: subscriptionId,
  } as any);
}

/**
 * List payment methods for a customer
 */
export async function listPaymentMethods(customerId: string) {
  return await stripe.customers.listPaymentMethods(customerId, {
    type: 'card',
  });
}

/**
 * Construct an event from a webhook payload
 * Verifies the signature using the webhook secret
 */
export function constructWebhookEvent(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export default stripe;
