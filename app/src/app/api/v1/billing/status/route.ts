/**
 * Get Billing Status API
 *
 * GET /api/v1/billing/status
 *
 * Returns the current billing status for the authenticated user's organization.
 * Includes subscription details, plan info, and usage metrics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization with subscription
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      include: {
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            workflows: true,
            integrations: true,
            users: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const subscription = organization.subscriptions[0];

    // Calculate plan limits
    const planLimits = {
      STARTER: { workflows: 5, integrations: 3, users: 2 },
      PROFESSIONAL: { workflows: 25, integrations: 10, users: -1 }, // -1 = unlimited
      ENTERPRISE: { workflows: -1, integrations: -1, users: -1 },
    };

    const limits = planLimits[organization.plan];

    // Format response
    const billingStatus = {
      organization: {
        id: organization.id,
        name: organization.name,
        plan: organization.plan,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            plan: subscription.plan,
            amount: subscription.amount,
            currency: subscription.currency,
            billingInterval: subscription.billingInterval,
            currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
            trialStart: subscription.trialStart,
            trialEnd: subscription.trialEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      usage: {
        workflows: organization._count.workflows,
        integrations: organization._count.integrations,
        users: organization._count.users,
      },
      limits,
      canUpgrade: organization.plan !== 'ENTERPRISE',
      isTrialing: subscription?.status === 'TRIALING',
      isPastDue: subscription?.status === 'PAST_DUE',
    };

    return NextResponse.json(billingStatus);
  } catch (error) {
    console.error('Billing status fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing status' },
      { status: 500 }
    );
  }
}
