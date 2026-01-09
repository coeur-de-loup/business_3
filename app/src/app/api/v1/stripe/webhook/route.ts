/**
 * Stripe Webhook Handler
 *
 * This endpoint receives webhook events from Stripe to handle:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Subscription modified
 * - customer.subscription.deleted: Subscription cancelled
 * - invoice.paid: Payment succeeded
 * - invoice.payment_failed: Payment failed
 *
 * Webhook signatures are verified for security.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripe, { constructWebhookEvent } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

// Prevent static optimization (requires runtime env vars)
export const dynamic = 'force-dynamic';

// Type definitions for Stripe webhook events
type StripeCheckoutSession = {
  id: string;
  customer?: string | null;
  metadata?: {
    organizationId?: string;
    plan?: string;
  };
};

type StripeSubscription = {
  id: string;
  customer?: string | null;
  metadata?: {
    organizationId?: string;
    plan?: string;
  };
  status: string;
  current_period_end: number;
  trial_start?: number | null;
  trial_end?: number | null;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount?: number | null;
        currency: string;
        recurring?: {
          interval: string;
        } | null;
      };
    }>;
  };
};

type StripeInvoice = {
  id: string;
  subscription?: string | null;
  paid: boolean;
};

// Webhook event handlers
const webhookHandlers = {
  'checkout.session.completed': handleCheckoutCompleted,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'invoice.paid': handleInvoicePaid,
  'invoice.payment_failed': handleInvoicePaymentFailed,
  'customer.subscription.created': handleSubscriptionCreated,
};

export async function POST(req: NextRequest) {
  try {
    // Get raw body and signature
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Log event for debugging
    console.log(`📬 Received webhook: ${event.type}`);

    // Get handler for this event type
    const handler = webhookHandlers[event.type as keyof typeof webhookHandlers];

    if (handler) {
      await handler(event.data.object as any);
      console.log(`✅ Handled webhook: ${event.type}`);
    } else {
      console.log(`⚠️  No handler for webhook: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 * Called when a customer completes checkout
 */
async function handleCheckoutCompleted(session: StripeCheckoutSession) {
  const organizationId = session.metadata?.organizationId;
  const plan = session.metadata?.plan as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  const customerId = session.customer as string;

  if (!organizationId || !plan || !customerId) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Update organization with Stripe customer ID
  await prisma.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customerId },
  });

  // Note: Subscription will be created/updated by the customer.subscription.created event
  console.log(`✅ Checkout completed for org ${organizationId}, plan ${plan}`);
}

/**
 * Handle customer.subscription.created
 * Called when a new subscription is created
 */
async function handleSubscriptionCreated(subscription: StripeSubscription) {
  const organizationId = subscription.metadata?.organizationId;
  const plan = subscription.metadata?.plan as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  const customerId = subscription.customer as string;

  if (!organizationId || !plan) {
    console.error('Missing metadata in subscription:', subscription.id);
    return;
  }

  // Find organization by Stripe customer ID
  const organization = await prisma.organization.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!organization) {
    console.error('Organization not found for customer:', customerId);
    return;
  }

  // Create or update subscription in database
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      organizationId: organization.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price?.id || '',
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      plan,
      status: subscription.status.toUpperCase() as any,
      amount: subscription.items.data[0]?.price?.unit_amount || 0,
      currency: subscription.items.data[0]?.price?.currency || 'usd',
      billingInterval: (subscription.items.data[0] as any)?.recurring?.interval === 'year'
        ? 'YEARLY'
        : 'MONTHLY',
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
    update: {
      status: subscription.status.toUpperCase() as any,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // Update organization plan
  await prisma.organization.update({
    where: { id: organization.id },
    data: { plan },
  });

  console.log(`✅ Subscription created for org ${organization.id}, plan ${plan}`);
}

/**
 * Handle customer.subscription.updated
 * Called when a subscription is modified
 */
async function handleSubscriptionUpdated(subscription: StripeSubscription) {
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    // Fallback: find org by customer ID
    const customerId = subscription.customer as string;
    const organization = await prisma.organization.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) {
      console.error('Organization not found for subscription update:', subscription.id);
      return;
    }
  }

  // Find organization
  const organization = await prisma.organization.findFirst({
    where: {
      OR: [
        { id: organizationId },
        { stripeCustomerId: subscription.customer as string },
      ],
    },
  });

  if (!organization) {
    console.error('Organization not found for subscription update:', subscription.id);
    return;
  }

  // Update subscription in database
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status.toUpperCase() as any,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      // If subscription was cancelled and will not renew
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // If subscription is cancelled, update organization plan to STARTER (or keep until period ends)
  if (subscription.cancel_at_period_end) {
    console.log(`⚠️  Subscription for org ${organization.id} will cancel at period end`);
  }

  console.log(`✅ Subscription updated for org ${organization.id}`);
}

/**
 * Handle customer.subscription.deleted
 * Called when a subscription is cancelled (deleted)
 */
async function handleSubscriptionDeleted(subscription: StripeSubscription) {
  // Find organization by subscription
  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { organization: true },
  });

  if (!dbSubscription) {
    console.error('Subscription not found:', subscription.id);
    return;
  }

  // Update subscription status
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'CANCELLED' },
  });

  // Downgrade organization to STARTER plan
  await prisma.organization.update({
    where: { id: dbSubscription.organization.id },
    data: { plan: 'STARTER' },
  });

  console.log(`✅ Subscription deleted for org ${dbSubscription.organization.id}`);
}

/**
 * Handle invoice.paid
 * Called when a payment succeeds
 */
async function handleInvoicePaid(invoice: StripeInvoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  // Find subscription
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: { organization: true },
  });

  if (!subscription) {
    console.error('Subscription not found for invoice:', invoice.id);
    return;
  }

  // Update subscription to active
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: 'ACTIVE' },
  });

  console.log(`💰 Payment succeeded for org ${subscription.organization.id}`);
}

/**
 * Handle invoice.payment_failed
 * Called when a payment fails
 */
async function handleInvoicePaymentFailed(invoice: StripeInvoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  // Find subscription
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: { organization: true },
  });

  if (!subscription) {
    console.error('Subscription not found for invoice:', invoice.id);
    return;
  }

  // Update subscription to past_due
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: 'PAST_DUE' },
  });

  // TODO: Send email to customer about failed payment
  console.log(`❌ Payment failed for org ${subscription.organization.id}`);

  // Retries are automatic in Stripe, but we may want to notify the customer
  // Stripe will retry 3 times over ~3 weeks before cancelling
}

// Note: In Next.js 15+, body parsing is handled automatically for webhooks
// The raw body is available via request.text() for signature verification
