/**
 * Billing Page Content (Client Component)
 *
 * Displays:
 * - Current subscription status
 * - Usage metrics (workflows, integrations, users)
 * - Plan limits
 * - Upgrade/downgrade options
 * - Link to billing portal
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PricingCard } from '@/components/billing/pricing-card';
import { SubscriptionStatusBadge } from '@/components/billing/subscription-status-badge';
import { PRICING_PLANS } from '@/lib/stripe';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';

interface BillingStatus {
  organization: {
    id: string;
    name: string;
    plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  };
  subscription: {
    id: string;
    status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED';
    plan: string;
    amount: number;
    currency: string;
    billingInterval: 'MONTHLY' | 'YEARLY';
    currentPeriodEnd: string;
    trialEnd?: string | null;
  } | null;
  usage: {
    workflows: number;
    integrations: number;
    users: number;
  };
  limits: {
    workflows: number;
    integrations: number;
    users: number;
  };
  canUpgrade: boolean;
  isTrialing: boolean;
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // Check for checkout success/cancel
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    // Fetch billing status
    async function fetchBillingStatus() {
      try {
        const response = await fetch('/api/v1/billing/status');
        if (!response.ok) {
          throw new Error('Failed to fetch billing status');
        }
        const data = await response.json();
        setStatus(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load billing status');
      } finally {
        setLoading(false);
      }
    }

    fetchBillingStatus();
  }, []);

  // Handle billing portal redirect
  async function handleBillingPortal() {
    setRedirecting(true);
    try {
      const response = await fetch('/api/v1/billing/portal', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to create billing portal session');
      }
      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      setRedirecting(false);
    }
  }

  // Handle upgrade
  async function handleUpgrade(plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE') {
    setRedirecting(true);
    try {
      const response = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      setRedirecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Error Loading Billing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || 'Failed to load billing information'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { organization, subscription, usage, limits, canUpgrade, isTrialing } = status;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Plans</h1>
        <p className="text-muted-foreground">Manage your subscription and payment methods</p>
      </div>

      {/* Success/Cancel Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200">Payment successful! Your subscription is now active.</p>
        </div>
      )}
      {canceled && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200">Payment canceled. You can upgrade anytime from the plans below.</p>
        </div>
      )}

      {/* Current Plan Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan</span>
            <SubscriptionStatusBadge status={subscription?.status || 'ACTIVE'} />
          </CardTitle>
          <CardDescription>
            {organization.name} is on the <strong>{organization.plan}</strong> plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Usage Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Workflows</p>
                <p className="text-2xl font-bold">
                  {usage.workflows} / {limits.workflows === -1 ? '∞' : limits.workflows}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Integrations</p>
                <p className="text-2xl font-bold">
                  {usage.integrations} / {limits.integrations === -1 ? '∞' : limits.integrations}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Users</p>
                <p className="text-2xl font-bold">
                  {usage.users} / {limits.users === -1 ? '∞' : limits.users}
                </p>
              </div>
            </div>

            {/* Billing Portal Button */}
            <div className="pt-4 border-t">
              <Button onClick={handleBillingPortal} disabled={redirecting} variant="outline">
                {redirecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Payment Method
                  </>
                )}
              </Button>
            </div>

            {/* Trial Warning */}
            {isTrialing && subscription?.trialEnd && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your trial ends on {new Date(subscription.trialEnd).toLocaleDateString()}.
                  Add a payment method to continue using the service.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(PRICING_PLANS).map(([planKey, plan]) => {
            const isCurrentPlan = organization.plan === planKey;
            const canUpgradeToThis = canUpgrade && !isCurrentPlan;

            return (
              <PricingCard
                key={planKey}
                {...plan}
                current={isCurrentPlan}
                onSelect={() => handleUpgrade(planKey as any)}
                disabled={!canUpgradeToThis}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
