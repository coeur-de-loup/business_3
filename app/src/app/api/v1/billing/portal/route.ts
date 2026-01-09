/**
 * Create Billing Portal Session API
 *
 * POST /api/v1/billing/portal
 *
 * Creates a Stripe billing portal session for managing subscriptions.
 * Returns the URL to redirect the user to the Stripe billing portal.
 *
 * The billing portal allows customers to:
 * - Update payment methods
 * - View invoices
 * - Cancel subscriptions
 * - Update billing information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createPortalSession } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

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

    // Get user's organization with Stripe customer ID
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

    if (!user.organization.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please complete checkout first.' },
        { status: 400 }
      );
    }

    // Create billing portal session
    const portalSession = await createPortalSession({
      customerId: user.organization.stripeCustomerId,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    // Return portal URL
    return NextResponse.json({
      portalUrl: portalSession.url,
    });
  } catch (error) {
    console.error('Billing portal session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
