/**
 * Billing Page
 *
 * Displays:
 * - Current subscription status
 * - Usage metrics (workflows, integrations, users)
 * - Plan limits
 * - Upgrade/downgrade options
 * - Link to billing portal
 */

'use client';

import { useEffect, useState } from 'react';
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
  isPastDue: boolean;
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // Check for checkout success/cancel
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    fetchBillingStatus();
  }, [success, canceled]);

  const fetchBillingStatus = async () => {
    try {
      const response = await fetch('/api/v1/billing/status');
      if (!response.ok) {
        throw new Error('Failed to fetch billing status');
      }
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: keyof typeof PRICING_PLANS) => {
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

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redirect to checkout');
      setRedirecting(false);
    }
  };

  const handleManageBilling = async () => {
    setRedirecting(true);
    try {
      const response = await fetch('/api/v1/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { portalUrl } = await response.json();
      window.location.href = portalUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      setRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
            <CardDescription>{error || 'Failed to load billing information'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      {/* Success/Cancel Messages */}
      {success && (
        <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <p className="text-green-800 dark:text-green-200">
              🎉 Payment successful! Your subscription is now active.
            </p>
          </CardContent>
        </Card>
      )}

      {canceled && (
        <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              Checkout was canceled. You can try again anytime.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Plan */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and payment methods</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-2xl font-bold">{status.organization.plan}</p>
            </div>

            {status.subscription && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <SubscriptionStatusBadge
                    status={status.subscription.status}
                    trialEndsAt={
                      status.subscription.trialEnd
                        ? new Date(status.subscription.trialEnd)
                        : null
                    }
                  />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-lg font-semibold">
                    ${status.subscription.amount / 100}{' '}
                    {status.subscription.currency}/{status.subscription.billingInterval.toLowerCase()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Next Billing Date</p>
                  <p className="text-sm">
                    {new Date(status.subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}

            {status.isPastDue && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded">
                <AlertCircle className="h-4 w-4" />
                <span>Payment failed. Please update your payment method.</span>
              </div>
            )}

            {status.subscription && (
              <Button
                onClick={handleManageBilling}
                disabled={redirecting}
                className="w-full"
                variant="outline"
              >
                {redirecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Manage Billing
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>Your current usage vs. plan limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Workflows</span>
                <span className="font-medium">
                  {status.usage.workflows}
                  {status.limits.workflows > 0 && ` / ${status.limits.workflows}`}
                  {status.limits.workflows === -1 && ' (unlimited)'}
                </span>
              </div>
              {status.limits.workflows > 0 && (
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${Math.min((status.usage.workflows / status.limits.workflows) * 100, 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Integrations</span>
                <span className="font-medium">
                  {status.usage.integrations}
                  {status.limits.integrations > 0 && ` / ${status.limits.integrations}`}
                  {status.limits.integrations === -1 && ' (unlimited)'}
                </span>
              </div>
              {status.limits.integrations > 0 && (
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${Math.min((status.usage.integrations / status.limits.integrations) * 100, 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Users</span>
                <span className="font-medium">
                  {status.usage.users}
                  {status.limits.users > 0 && ` / ${status.limits.users}`}
                  {status.limits.users === -1 && ' (unlimited)'}
                </span>
              </div>
              {status.limits.users > 0 && (
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${Math.min((status.usage.users / status.limits.users) * 100, 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Plans */}
      {status.canUpgrade && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Upgrade Your Plan</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {Object.entries(PRICING_PLANS).map(([plan, _]) => (
              <PricingCard
                key={plan}
                plan={plan as keyof typeof PRICING_PLANS}
                currentPlan={status.organization.plan}
                isPopular={plan === 'PROFESSIONAL'}
                onSubscribe={handleSubscribe}
                disabled={redirecting}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
