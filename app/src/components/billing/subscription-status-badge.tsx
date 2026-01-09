/**
 * Subscription Status Badge Component
 *
 * Displays the current subscription status with appropriate colors and icons.
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';

interface SubscriptionStatusBadgeProps {
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'INCOMPLETE';
  trialEndsAt?: Date | null;
}

export function SubscriptionStatusBadge({
  status,
  trialEndsAt,
}: SubscriptionStatusBadgeProps) {
  const statusConfig = {
    ACTIVE: {
      label: 'Active',
      variant: 'default' as const,
      icon: CheckCircle2,
      description: 'Your subscription is active.',
    },
    TRIALING: {
      label: 'Trial',
      variant: 'secondary' as const,
      icon: Clock,
      description: trialEndsAt
        ? `Trial ends on ${trialEndsAt.toLocaleDateString()}`
        : 'Trial period active.',
    },
    PAST_DUE: {
      label: 'Past Due',
      variant: 'destructive' as const,
      icon: AlertCircle,
      description: 'Payment failed. Please update your payment method.',
    },
    CANCELLED: {
      label: 'Cancelled',
      variant: 'outline' as const,
      icon: XCircle,
      description: 'Subscription has been cancelled.',
    },
    INCOMPLETE: {
      label: 'Incomplete',
      variant: 'outline' as const,
      icon: AlertCircle,
      description: 'Subscription is being set up.',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
      {status === 'TRIALING' && trialEndsAt && (
        <span className="text-sm text-muted-foreground">
          {trialEndsAt.toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
