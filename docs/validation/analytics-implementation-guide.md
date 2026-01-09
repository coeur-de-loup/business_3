# Analytics Implementation Guide

**Date:** January 9, 2026
**Purpose:** Step-by-step instructions to implement analytics tracking
**Estimated Time:** 4-6 hours

---

## Quick Start (2 Hour Setup)

### Step 1: Install Analytics Dependencies (30 min)

```bash
# Navigate to app directory
cd app

# Install analytics packages
pnpm add @sentry/nextjs posthog-js hotjar-browser
pnpm add -D @types/hotjar-js

# Install Stripe webhooks
pnpm add stripe
```

### Step 2: Environment Variables (15 min)

Add to `.env.local`:

```bash
# Google Analytics 4
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Hotjar
NEXT_PUBLIC_HOTJAR_SITE_ID=xxxxxxx

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o1234.ingest.sentry.io/12345
SENTRY_AUTH_TOKEN=your-auth-token

# Stripe Webhook Secret (get from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Step 3: Initialize Analytics Tools (1 hour)

#### 3.1 Google Analytics 4

Create `app/lib/analytics/ga4.ts`:

```typescript
// Google Analytics 4 initialization
export const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA4_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

export const event = (action: string, category: string, label: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
};
```

Add to `app/app/layout.tsx`:

```typescript
import Script from 'next/script';
import { GA4_MEASUREMENT_ID } from '@/lib/analytics/ga4';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* GA4 Global Site Tag */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### 3.2 PostHog (Event Tracking)

Create `app/lib/analytics/posthog.ts`:

```typescript
import posthog from 'posthog-js';

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY!;
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST!;

export const initPostHog = () => {
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      loaded: (ph) => {
        console.log('PostHog initialized');
      },
    });
  }
};

export const captureEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, traits);
  }
};
```

Add to `app/app/layout.tsx` (below GA4):

```typescript
import { initPostHog } from '@/lib/analytics/posthog';

// Add useEffect to initialize
useEffect(() => {
  initPostHog();
}, []);
```

#### 3.3 Sentry (Error Tracking)

Create `sentry.client.config.ts` in app root:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

Create `sentry.server.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

#### 3.4 Hotjar (Heatmaps & Recordings)

Add to `app/app/layout.tsx`:

```typescript
import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Hotjar initialization
    if (typeof window !== 'undefined') {
      (window as any).hj =
        (window as any).hj ||
        function () {
          ((window as any).hj.q = (window as any).hj.q || []).push(arguments);
        };
      (window as any)._hjSettings = {
        hjid: process.env.NEXT_PUBLIC_HOTJAR_SITE_ID,
        hjsv: 6,
      };
      const script = document.createElement('script');
      script.src = `https://static.hotjar.com/c/hotjar-${process.env.NEXT_PUBLIC_HOTJAR_SITE_ID}.js?sv=6`;
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // ... rest of layout
}
```

---

## Custom Event Tracking (2 Hours)

### Track User Signups

Create `app/lib/analytics/events.ts`:

```typescript
import { captureEvent, identifyUser } from './posthog';
import { event as gaEvent } from './ga4';

export type EventName =
  | 'user_signed_up'
  | 'account_created'
  | 'trial_started'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'workflow_created'
  | 'workflow_deployed'
  | 'workflow_executed'
  | 'workflow_failed'
  | 'template_viewed'
  | 'template_deployed'
  | 'integration_connected'
  | 'billing_page_viewed'
  | 'checkout_started'
  | 'payment_completed'
  | 'subscription_cancelled';

export const trackEvent = (
  eventName: EventName,
  properties?: Record<string, any>
) => {
  // Send to PostHog
  captureEvent(eventName, properties);

  // Send to GA4
  gaEvent(eventName, 'user_action', eventName);
};

export const trackSignup = (userId: string, email: string) => {
  trackEvent('user_signed_up', { email });
  identifyUser(userId, { email, signup_date: new Date().toISOString() });
};

export const trackWorkflowCreated = (
  userId: string,
  workflowId: string,
  isTemplate: boolean
) => {
  trackEvent('workflow_created', {
    workflow_id: workflowId,
    is_template: isTemplate,
  });
};

export const trackWorkflowExecuted = (
  userId: string,
  workflowId: string,
  success: boolean,
  duration?: number
) => {
  const eventName = success ? 'workflow_executed' : 'workflow_failed';
  trackEvent(eventName, {
    workflow_id: workflowId,
    duration,
  });
};

export const trackPaymentCompleted = (
  userId: string,
  amount: number,
  plan: string
) => {
  trackEvent('payment_completed', {
    amount,
    plan,
    currency: 'USD',
  });
};
```

### Integrate with Signup Flow

Update `app/app/api/v1/auth/signup/route.ts`:

```typescript
import { trackSignup } from '@/lib/analytics/events';

export async function POST(req: Request) {
  // ... existing signup logic ...

  const user = await createUser(email, password);

  // Track signup
  trackSignup(user.id, user.email);

  return NextResponse.json({ success: true, userId: user.id });
}
```

### Integrate with Workflow Creation

Update workflow creation API:

```typescript
import { trackWorkflowCreated } from '@/lib/analytics/events';

export async function createWorkflow(userId: string, templateId?: string) {
  const workflow = await db.workflows.create({
    userId,
    templateId,
    // ...
  });

  trackWorkflowCreated(
    userId,
    workflow.id,
    !!templateId // isTemplate
  );

  return workflow;
}
```

### Integrate with Stripe Webhooks

Update `app/app/api/v1/stripe/webhook/route.ts`:

```typescript
import { trackPaymentCompleted } from '@/lib/analytics/events';

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const amount = session.amount_total! / 100; // Convert cents to dollars
      const plan = session.metadata?.plan || 'professional';

      if (userId) {
        trackPaymentCompleted(userId, amount, plan);
      }
      break;

    case 'customer.subscription.deleted':
      // Track churn
      trackEvent('subscription_cancelled', {
        userId: event.data.object.metadata?.userId,
      });
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## Dashboard Setup (1 Hour)

### Option 1: Google Looker Studio (Free, Recommended)

1. **Create Looker Studio Account**
   - Go to https://lookerstudio.google.com
   - Sign in with Google account

2. **Connect GA4 Data Source**
   - Click "Create" → "Data Source"
   - Select "Google Analytics 4"
   - Choose your GA4 property
   - Click "Connect"

3. **Build Dashboard**

Create these charts:

**Acquisition Tab:**
- Line chart: Daily unique visitors
- Pie chart: Traffic sources
- Table: Top referrers

**Activation Tab:**
- Funnel chart: Signup → Account created → First workflow
- Bar chart: Time to first workflow (distribution)
- Pie chart: Template vs. custom workflow

**Engagement Tab:**
- Line chart: DAU, WAU, MAU
- Bar chart: Active workflows over time
- Scorecard: Workflow success rate

**Revenue Tab:**
- Line chart: MRR growth
- Table: Paying customers by plan
- Scorecard: Trial-to-paid conversion rate

4. **Share Dashboard**
   - Click "Share" → "Get link"
   - Enable "View only"
   - Share with team

### Option 2: Metabase (Self-Hosted, More Control)

```bash
# Using Docker (easiest)
docker run -d -p 3000:3000 \
  -e "MB_DB_FILE=/metabase-data/metabase.db" \
  -v ~/metabase-data:/metabase-data \
  --name metabase \
  metabase/metabase:latest
```

1. **Open Metabase**
   - Go to http://localhost:3000
   - Create admin account
   - Set up database connection (use Supabase connection string)

2. **Connect to PostgreSQL**
   - Add database: Postgres
   - Host: Your Supabase host
   - Port: 5432
   - Database name: Your DB name
   - Username: Your DB user
   - Password: Your DB password

3. **Create Questions (Saved Queries)**

Example: Daily Signups
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as signups
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

Example: Active Workflows (Last 7 Days)
```sql
SELECT
  COUNT(DISTINCT workflow_id) as active_workflows
FROM events
WHERE event_name = 'workflow_executed'
  AND timestamp >= NOW() - INTERVAL '7 days';
```

4. **Build Dashboard**
   - Click "New" → "Dashboard"
   - Add questions from above
   - Arrange in grid layout

---

## Alerting Setup (30 min)

### Sentry Alerts (Errors)

1. **Go to Sentry Dashboard**
   - https://sentry.io

2. **Create Alert Rule**
   - Settings → Alerts → New Alert Rule
   - Trigger: Error rate > 1% for 5 minutes
   - Action: Send Slack notification

3. **Configure Slack Integration**
   - Sentry → Settings → Integrations → Slack
   - Connect Slack workspace
   - Select channel (e.g., #alerts)

### Custom Alerts (PostHog)

Create `app/app/api/v1/cron/daily-metrics/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  // Get yesterday's metrics
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const signups = await db.user.count({
    where: {
      created_at: {
        gte: yesterday,
      },
    },
  });

  // Alert if signups < 5
  if (signups < 5) {
    // Send Slack webhook
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `⚠️ Warning: Only ${signups} signups yesterday (target: 5+)`,
      }),
    });
  }

  return NextResponse.json({ checked: true });
}
```

### Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/v1/cron/daily-metrics",
      "schedule": "0 9 * * *" // 9 AM daily
    }
  ]
}
```

---

## Testing Checklist (30 min)

Before launching, verify all tracking works:

### Test Signup Flow

1. **Create test account**
   ```bash
   # In browser incognito mode
   # Go to http://localhost:3000/signup
   # Sign up with test@email.com
   ```

2. **Verify GA4 event**
   - Open GA4 Real-time report
   - Check "user_signed_up" event appears

3. **Verify PostHog event**
   - Open PostHog dashboard
   - Check "Events" tab
   - Filter by "user_signed_up"

### Test Payment Flow

1. **Create Stripe test checkout**
   - Use test card: 4242 4242 4242 4242
   - Complete payment

2. **Verify webhook received**
   - Check Stripe Dashboard → Webhooks
   - Verify "checkout.session.completed" delivered

3. **Verify payment event tracked**
   - Check PostHog for "payment_completed" event
   - Verify amount and plan properties correct

### Test Error Tracking

1. **Trigger error**
   ```typescript
   // Add temporary button in dev mode
   <button onClick={() => throw new Error('Test error')}>
     Test Sentry
   </button>
   ```

2. **Verify error captured**
   - Check Sentry Dashboard
   - Verify error appears with stack trace

---

## Launch Day Verification

### Pre-Launch Checklist

- [ ] GA4 tracking code installed
- [ ] PostHog SDK initialized
- [ ] Hotjar recording enabled
- [ ] Sentry error tracking active
- [ ] Custom events tested
- [ ] Dashboard created and shared
- [ ] Alerts configured
- [ ] Database tables created
- [ ] Stripe webhooks verified

### Go-Live Verification (5 min after deploy)

- [ ] Visit site → Check GA4 Real-time (you appear)
- [ ] Sign up test account → Check "user_signed_up" event
- [ ] Create workflow → Check "workflow_created" event
- [ ] Execute workflow → Check "workflow_executed" event
- [ ] Trigger error → Check Sentry error logged

### Day 1 Checks

- [ ] Morning: Check all metrics in dashboard
- [ ] Afternoon: Respond to user feedback
- [ ] Evening: Review day's performance (signups, errors)

---

## Cost Estimate (Free Tiers)

| Tool | Free Tier | Paid Tier (if needed) |
|------|-----------|----------------------|
| Google Analytics 4 | Unlimited | Free |
| PostHog | 1M events/month | $25/mo for 10M events |
| Hotjar | 1,000 sessions/day | $39/mo for 10,000 sessions |
| Sentry | 5K errors/month | $26/mo for 100K errors |
| Looker Studio | Free | Free |
| **Total** | **$0/month** | **$90/month** |

**Recommendation:** Start with all free tiers. Upgrade only if limits exceeded.

---

## Troubleshooting

### Issue: Events Not Appearing in GA4

**Solution:**
1. Check GA4 Measurement ID is correct
2. Verify gtag is loaded (check browser console)
3. Check ad blocker is disabled for your site
4. Wait 5-10 minutes (GA4 has slight delay)

### Issue: PostHog Events Not Showing

**Solution:**
1. Check PostHog API key is correct
2. Verify PostHog is initialized (check browser console)
3. Use PostHog debugger: https://app.posthog.com/debugger
4. Check browser network tab (look for POST to posthog.com)

### Issue: Stripe Webhook Failing

**Solution:**
1. Verify webhook secret in `.env.local`
2. Check Stripe Dashboard → Webhooks → See recent deliveries
3. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/v1/stripe/webhook
   ```
4. Check server logs for webhook errors

### Issue: Sentry Not Capturing Errors

**Solution:**
1. Verify DSN is correct
2. Check Sentry environment (should be "production")
3. Test with `Sentry.captureException(new Error('Test'))`
4. Check browser console for Sentry initialization errors

---

**Document Status:** ✅ Implementation Guide Complete
**Next Step:** Set up analytics tools (follow Quick Start)
**Time Required:** 4-6 hours
**Skill Level:** Intermediate developer
