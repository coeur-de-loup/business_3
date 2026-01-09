/**
 * Create Checkout Session API
 *
 * POST /api/v1/billing/checkout
 *
 * Creates a Stripe checkout session for a new subscription.
 * Returns the URL to redirect the user to Stripe Checkout.
 *
 * Body:
 * {
 *   "plan": "STARTER" | "PROFESSIONAL" | "ENTERPRISE"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createCheckoutSession, PRICING_PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const checkoutSchema = z.object({
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
});

// Prevent static optimization (requires runtime env vars)
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = checkoutSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid plan', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { plan } = validationResult.data;

    // Check if plan has a price ID configured
    if (!PRICING_PLANS[plan].priceId) {
      return NextResponse.json(
        { error: 'Plan not available for purchase', plan },
        { status: 400 }
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user?.organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Create Stripe checkout session
    const checkoutSession = await createCheckoutSession({
      organizationId: user.organization.id,
      plan,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      userEmail: user.email,
    });

    // Return checkout URL
    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
