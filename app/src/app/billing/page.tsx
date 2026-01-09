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

import dynamic from 'next/dynamic';

const BillingClient = dynamic(() => import('./billing-client'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function BillingPage() {
  return <BillingClient />;
}
