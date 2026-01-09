/**
 * Pricing Card Component
 *
 * Displays pricing information for a plan with:
 * - Plan name and price
 * - Feature list
 * - CTA button (Subscribe or Upgrade)
 * - Badge for popular plans
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { PRICING_PLANS } from '@/lib/stripe';

interface PricingCardProps {
  plan: keyof typeof PRICING_PLANS;
  currentPlan?: string;
  isPopular?: boolean;
  onSubscribe?: (plan: keyof typeof PRICING_PLANS) => void;
  disabled?: boolean;
}

export function PricingCard({
  plan,
  currentPlan,
  isPopular = false,
  onSubscribe,
  disabled = false,
}: PricingCardProps) {
  const pricing = PRICING_PLANS[plan];
  const isCurrentPlan = currentPlan === plan;
  const priceInDollars = pricing.amount / 100;

  return (
    <Card
      className={`relative flex flex-col ${
        isPopular ? 'border-primary shadow-lg scale-105' : ''
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{pricing.name}</CardTitle>
        <CardDescription>
          <div className="mt-4">
            <span className="text-4xl font-bold">${priceInDollars}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {pricing.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? 'outline' : 'default'}
          onClick={() => onSubscribe?.(plan)}
          disabled={isCurrentPlan || disabled}
        >
          {isCurrentPlan ? 'Current Plan' : 'Subscribe'}
        </Button>
      </CardFooter>
    </Card>
  );
}
