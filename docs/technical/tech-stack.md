# Technology Stack: SMB AI Orchestration Platform

**Date:** January 8, 2026
**Status:** Draft - MVP Stack
**Version:** 1.0
**Architect:** Code Architect Agent

---

## Executive Summary

This document defines the technology stack for the SMB AI Orchestration Platform, balancing speed to market, scalability, simplicity, and team expertise.

**Selection Criteria:**
- **Speed to Market:** Proven technologies with abundant resources
- **Developer Experience:** Great documentation, tooling, and community
- **Scalability:** Can handle 500 → 10,000 customers with evolution
- **Hiring:** Mainstream technologies, easy to find developers
- **Cost:** Free tiers and managed services to minimize initial costs

**Core Philosophy:**
> "Use boring technology. The innovation is in the product, not the stack."

---

## 1. Frontend Stack

### 1.1 Framework: Next.js 14+ (React)

**Choice:** Next.js 14+ with App Router

**Rationale:**

✅ **Performance:**
- Server-side rendering (SSR) for fast initial load
- Static site generation (SSG) for marketing pages
- Automatic code splitting and lazy loading
- Image optimization (WebP, AVIF, responsive)
- Font optimization (automatic font subsetting)

✅ **Developer Experience:**
- TypeScript support (first-class)
- Hot module replacement for fast iteration
- File-based routing (intuitive)
- API routes (backend in same codebase)
- Great debugging and error overlays

✅ **Ecosystem:**
- Largest React framework (most downloads, active development)
- Abundant libraries and components
- Strong community support
- Regular updates and improvements
- Vercel integration (zero-config deployment)

✅ **SEO-Friendly:**
- Server rendering for search engines
- Meta tags management (next/head)
- Sitemap and robots.txt generation
- Perfect for content marketing strategy

**Alternatives Considered:**
- **Remix:** Great framework but smaller ecosystem, steeper learning curve
- **Vue.js + Nuxt:** Smaller community, harder to hire developers
- **SvelteKit:** Too new, less production-ready

**Learning Resources:**
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn Course](https://nextjs.org/learn)
- [Next.js GitHub Examples](https://github.com/vercel/next.js/tree/canary/examples)

---

### 1.2 UI Component Library: shadcn/ui

**Choice:** shadcn/ui (built on Radix UI + Tailwind CSS)

**Rationale:**

✅ **Modern Design:**
- Beautiful, accessible components out of the box
- Fully customizable (copy code, own it)
- Dark mode support built-in
- Responsive by default

✅ **Accessibility:**
- Radix UI primitives (ARIA compliant)
- Keyboard navigation
- Screen reader support
- High contrast ratios

✅ **Developer Experience:**
- TypeScript support
- Tailwind CSS for styling (fast iteration)
- Copy-paste components (full control)
- No npm dependency bloat
- Easy to customize and extend

✅ **Performance:**
- No runtime JavaScript overhead
- Tree-shakeable
- Minimal bundle size

**Alternatives Considered:**
- **Material-UI:** Heavy bundle size, opinionated design
- **Chakra UI:** Good but less customizable than shadcn/ui
- **Ant Design:** Too enterprise-focused, heavy

**Learning Resources:**
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

### 1.3 State Management: React Query + Zustand

**Choice:** React Query (server state) + Zustand (client state)

**Rationale:**

✅ **React Query (Server State):**
- Automatic caching and refetching
- Background updates (stale-while-revalidate)
- Optimistic updates
- Pagination, infinite scroll support
- Perfect for API data (workflows, templates, user data)
- Reduces boilerplate code significantly

✅ **Zustand (Client State):**
- Simple API (no Redux boilerplate)
- TypeScript support
- Small bundle size
- Perfect for UI state (modals, sidebars, filters)
- Easy to learn and use

**Alternatives Considered:**
- **Redux Toolkit:** Overkill for MVP, too much boilerplate
- **Context API:** Re-renders too often, no caching
- **Jotai/Recoil:** Good but smaller ecosystem

**Learning Resources:**
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

---

### 1.4 Forms: React Hook Form + Zod

**Choice:** React Hook Form + Zod validation

**Rationale:**

✅ **React Hook Form:**
- Minimal re-renders (performant)
- Small bundle size
- Easy to integrate with validation
- Great developer experience
- Built-in error handling

✅ **Zod Validation:**
- TypeScript-first schema validation
- Type inference (automatic types from schemas)
- Composable schemas
- Great error messages
- Works on client and server

**Example:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const workflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.enum(['marketing', 'sales', 'operations']),
});

function CreateWorkflowForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(workflowSchema),
  });

  const onSubmit = (data) => {
    // data is automatically typed
    createWorkflow(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  );
}
```

**Alternatives Considered:**
- **Formik:** Heavier, more boilerplate
- **Yup:** Less TypeScript-friendly than Zod

---

## 2. Backend Stack

### 2.1 Runtime: Node.js 20+ (LTS)

**Choice:** Node.js 20+ LTS version

**Rationale:**

✅ **Unified Language:**
- TypeScript on frontend and backend
- Share code between client and server (types, utilities)
- Single language for full-stack development

✅ **Ecosystem:**
- Largest package ecosystem (npm)
- Abundant libraries for every need
- Active community and support
- Regular updates and security patches

✅ **Performance:**
- Fast I/O (event loop, non-blocking)
- Great for API servers
- Handles concurrent requests well
- V8 optimizations

✅ **Developer Experience:**
- TypeScript support (first-class)
- Hot reload (fast iteration)
- Great debugging tools
- Easy to learn

**Alternatives Considered:**
- **Python:** Great for AI/ML but slower for APIs, less unified with frontend
- **Go:** Faster performance but smaller ecosystem, steeper learning curve
- **Bun/Node Alternatives:** Too new, less stable

---

### 2.2 Framework: Next.js API Routes

**Choice:** Next.js API Routes (serverless functions)

**Rationale:**

✅ **Integrated:**
- Same framework as frontend
- Shared code and types
- Single deployment (Vercel)
- No separate backend server

✅ **Performance:**
- Serverless (auto-scaling)
- Edge functions (global deployment)
- Automatic caching
- Fast response times

✅ **Developer Experience:**
- Easy to create API endpoints
- TypeScript support
- Middleware support (auth, logging)
- Preview deployments

**Example API Route:**

```typescript
// app/api/workflows/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createWorkflow } from '@/lib/workflows';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const workflow = await createWorkflow(session.user.id, body);

  return NextResponse.json(workflow);
}
```

**Alternatives Considered:**
- **Express.js:** More control but more boilerplate, need separate server
- **NestJS:** Too structured for MVP, slower development
- **Fastify:** Faster but smaller ecosystem

---

### 2.3 ORM: Prisma

**Choice:** Prisma ORM with PostgreSQL

**Rationale:**

✅ **TypeScript-First:**
- Auto-generated types from schema
- Type-safe database queries
- Great IntelliSense
- Catches errors at compile time

✅ **Developer Experience:**
- Intuitive schema definition
- Easy migrations
- Great documentation
- Visual database browser (Prisma Studio)

✅ **Performance:**
- Optimized queries
- Connection pooling
- Batch operations
- Eager loading (no N+1 queries)

**Example Schema:**

```prisma
// prisma/schema.prisma
model Workflow {
  id          String   @id @default(cuid())
  name        String
  description String?
  definition   Json     // Workflow JSON
  organization Organization @relation(fields: [organizationId], references: [id])
  organizationId String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([organizationId])
}

model Organization {
  id        String     @id @default(cuid())
  name      String
  users     User[]
  workflows Workflow[]
  createdAt DateTime   @default(now())
}
```

**Alternatives Considered:**
- **Drizzle ORM:** Newer, less mature, smaller ecosystem
- **TypeORM:** More boilerplate, less intuitive
- **Knex.js:** Too low-level, more manual work

**Learning Resources:**
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

---

## 3. Database & Storage

### 3.1 Primary Database: PostgreSQL

**Choice:** PostgreSQL 15+ (hosted on Supabase)

**Rationale:**

✅ **Relational Data:**
- Perfect for highly relational data (users, orgs, workflows)
- ACID compliance (critical for workflow state)
- Foreign keys and constraints
- Complex queries (joins, aggregations)

✅ **JSON Support:**
- JSONB type for workflow definitions
- Query JSON fields efficiently
- Flexible schema (no migrations for JSON changes)

✅ **Scalability:**
- Proven to scale to millions of records
- Read replicas for reporting
- Partitioning for large tables
- Full-text search

✅ **Ecosystem:**
- Most advanced open-source database
- Abundant tools and hosting options
- Strong community support
- Regular updates

**Hosting Options:**

**Option 1: Supabase (Recommended for MVP)**
- Free tier: 500MB storage, 1GB bandwidth/month
- Built-in auth, storage, real-time
- Great developer experience
- Auto-scaling
- Cost: Free → $25/month

**Option 2: AWS RDS (For Scale)**
- More control and configuration
- VPC deployment (private network)
- Read replicas
- Backups and snapshots
- Cost: $15-200/month based on size

**Alternatives Considered:**
- **MySQL:** Less advanced features, less JSON support
- **MongoDB:** No ACID, less relational, scaling challenges
- **SQLite:** Not scalable, single file

---

### 3.2 Caching Layer: Redis

**Choice:** Redis 7+ (hosted on Upstash)

**Rationale:**

✅ **Performance:**
- In-memory operations (extremely fast)
- Sub-millisecond response times
- Reduces database load
- Improves API response times

✅ **Versatility:**
- Session storage
- API response caching
- Job queues (BullMQ)
- Rate limiting
- Pub/Sub (real-time features)

✅ **Data Structures:**
- Strings (simple caching)
- Hashes (user sessions)
- Lists (job queues)
- Sets (unique items)
- Sorted sets (leaderboards)

**Hosting Options:**

**Option 1: Upstash (Recommended for MVP)**
- Serverless Redis (pay-per-use)
- Edge caching (global deployment)
- Free tier: 10,000 commands/day
- Great developer experience
- Cost: Free → $10/month

**Option 2: Redis Cloud**
- Managed Redis service
- More features and control
- Auto-scaling
- Cost: $7-50/month

**Option 3: AWS ElastiCache (For Scale)**
- Fully managed Redis
- VPC deployment
- Read replicas
- Cost: $20-200/month

**Use Cases:**

```typescript
// Session Storage
await redis.set(`session:${userId}`, session, { ex: 3600 });

// API Response Caching
const cached = await redis.get(`workflows:${userId}`);
if (cached) return JSON.parse(cached);

const workflows = await db.workflow.findMany();
await redis.set(`workflows:${userId}`, JSON.stringify(workflows), { ex: 60 });
return workflows;

// Rate Limiting
const requests = await redis.incr(`ratelimit:${userId}`);
if (requests > 100) throw new Error('Rate limit exceeded');
await redis.expire(`ratelimit:${userId}`, 60);
```

**Alternatives Considered:**
- **Memcached:** Less feature-rich, no persistence
- **In-memory cache:** Not scalable, not shared across servers

---

### 3.3 File Storage: Cloud Storage (S3-compatible)

**Choice:** AWS S3 or Supabase Storage

**Rationale:**

✅ **Scalability:**
- Virtually unlimited storage
- High availability (99.999999999% durability)
- Global CDN distribution
- Fast downloads

✅ **Cost-Effective:**
- Pay for what you use
- Cheap storage classes (Glacier for archives)
- Free tier allowances

✅ **Features:**
- Pre-signed URLs (secure uploads)
- Image resizing (on-the-fly)
- Metadata and tags
- Lifecycle policies (auto-delete old files)

**Hosting Options:**

**Option 1: Supabase Storage (Recommended for MVP)**
- Integrated with Supabase
- Row-level security
- Free tier: 1GB storage, 2GB bandwidth/month
- Easy to use

**Option 2: AWS S3 (For Scale)**
- Industry standard
- More features and control
- Cheaper at scale
- Cost: $0.023/GB/month

**Use Cases:**
- User avatar uploads
- Workflow export files (CSV, JSON)
- Template thumbnails
- Document attachments

---

## 4. AI & Integration APIs

### 4.1 AI Model Providers

**Choice:** Multiple providers (OpenAI, Anthropic, Google)

**Rationale:**

✅ **OpenAI (Primary):**
- GPT-4 for complex reasoning
- GPT-3.5 for faster/cheaper tasks
- Best model performance
- Great documentation
- Function calling support

✅ **Anthropic Claude (Secondary):**
- Claude 3 Opus for high-quality outputs
- Larger context window (200K tokens)
- More stable/reliable for some tasks
- Different safety approach

✅ **Google Gemini (Tertiary):**
- Cost-effective for some use cases
- Multimodal capabilities (images, video)
- Google ecosystem integration

**Implementation:**

```typescript
// Unified AI client interface
interface AIProvider {
  name: 'openai' | 'anthropic' | 'google';
  model: string;
  apiKey: string;
  call(prompt: string, options?: CallOptions): Promise<string>;
}

// Example usage
const aiProviders: AIProvider[] = [
  { name: 'openai', model: 'gpt-4', apiKey: process.env.OPENAI_API_KEY },
  { name: 'anthropic', model: 'claude-3-opus', apiKey: process.env.ANTHROPIC_API_KEY },
];

async function generateText(prompt: string) {
  // Use cheapest provider that meets requirements
  const provider = selectProvider(prompt);
  return await provider.call(prompt);
}
```

**Cost Management:**
- Track token usage per user
- Implement cost limits per tier
- Cache responses when possible
- Use cheaper models for simple tasks

---

### 4.2 Business Tool Integrations

**Choice:** Native integrations for top 10 tools + Zapier/Make for long-tail

**Primary Integrations (Native):**

1. **Google Workspace** (Gmail, Google Sheets, Google Docs)
   - Use Google APIs with OAuth 2.0
   - Webhooks for real-time events

2. **Slack**
   - Slack API with OAuth
   - Slash commands for workflow triggers

3. **HubSpot**
   - HubSpot API with OAuth
   - CRM and marketing automation

4. **Notion**
   - Notion API with OAuth
   - Knowledge management and docs

5. **Trello/Asana**
   - Task management integration
   - Project tracking workflows

6. **Stripe**
   - Payment and billing integration
   - Subscription management

7. **Mailchimp**
   - Email marketing automation
   - Campaign management

8. **Calendly**
   - Scheduling automation
   - Meeting workflows

9. **Salesforce**
   - Enterprise CRM integration
   - Custom workflows

10. **Zapier/Make**
   - Bridge to 5,000+ apps
   - For non-native integrations

**Integration Architecture:**

```typescript
// Base integration interface
interface Integration {
  id: string;
  name: string;
  authType: 'oauth' | 'apiKey' | 'basic';

  authenticate(credentials: Credentials): Promise<Session>;
  call(action: string, params: any): Promise<any>;
  handleWebhook?(event: any): Promise<void>;
}

// Example: Gmail integration
class GmailIntegration implements Integration {
  id = 'gmail';
  name = 'Gmail';
  authType = 'oauth';

  async authenticate(credentials: OAuthCredentials) {
    // Exchange code for tokens
    const tokens = await google.oauth2(credentials.code);
    return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token };
  }

  async call(action: string, params: any) {
    switch (action) {
      case 'read_email':
        return await this.readEmail(params.emailId);
      case 'send_email':
        return await this.sendEmail(params.to, params.subject, params.body);
      case 'search_emails':
        return await this.searchEmails(params.query);
    }
  }

  async handleWebhook(event: GmailEvent) {
    // Trigger workflow when new email arrives
    if (event.type === 'NEW_EMAIL') {
      await triggerWorkflow(event.emailId);
    }
  }
}
```

---

## 5. Infrastructure & DevOps

### 5.1 Hosting: Vercel (Frontend + API)

**Choice:** Vercel for Next.js deployment

**Rationale:**

✅ **Zero-Config Deployment:**
- Automatic deployments from Git
- Preview deployments for every PR
- Rollback to any previous deployment
- Environment variables management

✅ **Performance:**
- Global edge network
- Automatic HTTPS
- Image optimization
- Static asset CDN

✅ **Developer Experience:**
- Great analytics dashboard
- Performance monitoring
- Log streaming
- Webhooks for deployments

✅ **Free Tier:**
- 100GB bandwidth/month
- Unlimited deployments
- 1000 edge functions invocations/day (Hobby plan)
- Perfect for MVP

**Pricing:**
- **Hobby:** Free (sufficient for MVP)
- **Pro:** $20/month (need after 100 customers)
- **Team:** $40/user/month (need for team collaboration)

**Alternatives Considered:**
- **Netlify:** Similar features but less Next.js optimization
- **AWS Amplify:** More control but more complex setup
- **Cloudflare Pages:** Newer, less mature

---

### 5.2 Database Hosting: Supabase

**Choice:** Supabase for PostgreSQL

**Rationale:**

✅ **All-in-One:**
- PostgreSQL database
- Authentication (built-in)
- File storage (S3-compatible)
- Real-time subscriptions
- Edge functions (serverless)

✅ **Developer Experience:**
- Great dashboard UI
- Row-level security
- Auto-generated APIs (REST, GraphQL)
- Migration management

✅ **Free Tier:**
- 500MB database storage
- 1GB file storage
- 2GB bandwidth/month
- 50,000 monthly active users

**Pricing:**
- **Free:** $0 (sufficient for MVP)
- **Pro:** $25/month (need after 100 customers)
- **Team/Enterprise:** Custom pricing

**Alternatives Considered:**
- **AWS RDS:** More control but higher cost and complexity
- **Neon:** Serverless PostgreSQL, newer but promising
- **PlanetScale:** MySQL-only, less suitable

---

### 5.3 CI/CD: GitHub Actions

**Choice:** GitHub Actions for CI/CD

**Rationale:**

✅ **Integrated:**
- Works seamlessly with GitHub
- No additional setup
- Free for public repos
- Generous free tier for private repos

✅ **Features:**
- Automated testing on every PR
- Deployment automation
- Docker build support
- Secret management
- Matrix builds (test across Node versions)

**Example Workflow:**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

**Alternatives Considered:**
- **GitLab CI:** Good if using GitLab, but we use GitHub
- **CircleCI:** More features but additional setup
- **Travis CI:** Less popular now

---

### 5.4 Monitoring & Error Tracking

**Choice:** Sentry (errors) + Vercel Analytics (metrics) + PostHog (analytics)

**Rationale:**

✅ **Sentry (Error Tracking):**
- Real-time error alerts
- Stack traces with source maps
- User context (who encountered error)
- Release tracking
- Performance monitoring
- Free tier: 5,000 errors/month

✅ **Vercel Analytics (Metrics):**
- Page views and visitors
- Core Web Vitals (LCP, FID, CLS)
- Device and browser breakdown
- Geographic distribution
- Integrated with Vercel deployment

✅ **PostHog (User Analytics):**
- Event tracking (funnels, retention)
- Feature flags
- A/B testing
- Session recordings
- Open-source, self-hostable
- Free tier: 1M events/month

**Alternatives Considered:**
- **Datadog:** More comprehensive but expensive ($15+/host/month)
- **Mixpanel:** Good analytics but less generous free tier
- **Google Analytics:** Privacy concerns, less detailed

---

### 5.5 Email & Notifications

**Choice:** Resend (transactional emails)

**Rationale:**

✅ **Developer Experience:**
- Beautiful email templates (React-based)
- TypeScript support
- Great documentation
- Easy to use

✅ **Deliverability:**
- High inbox rates
- SPF, DKIM, DMARC setup
- Warmup process
- Reputation management

✅ **Free Tier:**
- 3,000 emails/month
- Sufficient for MVP

**Pricing:**
- **Free:** 3,000 emails/month
- **Pro:** $20/month (50,000 emails/month)
- **Enterprise:** Custom

**Use Cases:**
- Welcome emails
- Password reset
- Weekly reports
- Workflow failure notifications
- Marketing emails (optional)

**Alternatives Considered:**
- **SendGrid:** More popular but higher cost
- **Mailgun:** Good but complex setup
- **AWS SES:** Cheaper but harder to use

---

## 6. Development Tools

### 6.1 Version Control: Git + GitHub

**Choice:** Git with GitHub

**Rationale:**
- Industry standard
- Great collaboration features
- Issue tracking
- Pull request reviews
- GitHub Actions (CI/CD)
- Free for private repos

**Workflow:**
- Main branch (production)
- Develop branch (staging)
- Feature branches (feature/name)
- PR reviews required
- Protected branches

---

### 6.2 Package Manager: pnpm

**Choice:** pnpm (fast, disk-efficient)

**Rationale:**
- Faster than npm/yarn (2-3x)
- Disk efficient (hard links)
- Strict dependency management
- Monorepo support (future)
- Drop-in replacement for npm

**Installation:**
```bash
npm install -g pnpm
pnpm install
```

---

### 6.3 Code Quality: ESLint + Prettier

**Choice:** ESLint (linting) + Prettier (formatting)

**Rationale:**

✅ **ESLint:**
- Catches errors and bugs
- Enforces consistent style
- TypeScript support
- React-specific rules
- Auto-fix issues

✅ **Prettier:**
- Opinionated formatter
- Consistent code style
- Integrates with ESLint
- Auto-format on save

**Configuration:**

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

---

### 6.4 Testing: Vitest + Playwright

**Choice:** Vitest (unit) + Playwright (e2e)

**Rationale:**

✅ **Vitest (Unit/Integration):**
- Fast (native ESM)
- Jest-compatible API
- TypeScript support
- Watch mode
- Coverage reporting

✅ **Playwright (E2E):**
- Cross-browser (Chrome, Firefox, Safari)
- Fast execution
- Auto-waiting (no flaky tests)
- Great debugging tools
- Visual regression testing

**Example Tests:**

```typescript
// Unit test with Vitest
import { describe, it, expect } from 'vitest';
import { createWorkflow } from './workflows';

describe('createWorkflow', () => {
  it('creates a workflow with valid data', async () => {
    const workflow = await createWorkflow({
      name: 'Test Workflow',
      definition: { steps: [] },
    });

    expect(workflow.id).toBeDefined();
    expect(workflow.name).toBe('Test Workflow');
  });
});

// E2E test with Playwright
import { test, expect } from '@playwright/test';

test('user can create a workflow', async ({ page }) => {
  await page.goto('/workflows');
  await page.click('button:text("Create Workflow")');
  await page.fill('input[name="name"]', 'Test Workflow');
  await page.click('button:text("Save")');

  await expect(page.locator('text=Workflow created')).toBeVisible();
});
```

**Alternatives Considered:**
- **Jest:** Slower, less modern
- **Cypress:** Slower than Playwright

---

### 6.5 Type Safety: TypeScript

**Choice:** TypeScript (strict mode)

**Rationale:**
- Catches errors at compile time
- Better IDE support (IntelliSense)
- Self-documenting code
- Refactoring confidence
- Industry standard for modern web apps

**Configuration:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## 7. Third-Party Services Summary

### 7.1 MVP Services (Months 1-6)

| Service | Provider | Cost (Monthly) | Purpose |
|---------|----------|----------------|---------|
| Hosting | Vercel | $0 (Free tier) | Frontend + API |
| Database | Supabase | $0 (Free tier) | PostgreSQL |
| Cache | Upstash Redis | $0 (Free tier) | Caching + Queues |
| Email | Resend | $0 (3,000 emails) | Transactional emails |
| Error Tracking | Sentry | $0 (5,000 errors) | Error monitoring |
| Analytics | PostHog | $0 (1M events) | User analytics |
| Domain | Cloudflare | $10 | Custom domain |
| **Total** | | **~$10/month** | |

### 7.2 Growth Services (Months 7-12)

| Service | Provider | Cost (Monthly) | Purpose |
|---------|----------|----------------|---------|
| Hosting | Vercel Pro | $20 | Frontend + API |
| Database | Supabase Pro | $25 | PostgreSQL |
| Cache | Upstash Pro | $10 | Redis + Queues |
| Email | Resend Pro | $20 | Transactional emails |
| Error Tracking | Sentry | $26 | Error monitoring |
| Analytics | PostHog | $0 (1M events) | User analytics |
| Domain | Cloudflare | $10 | Custom domain |
| **Total** | | **~$111/month** | |

### 7.3 Scale Services (Year 3+)

| Service | Provider | Cost (Monthly) | Purpose |
|---------|----------|----------------|---------|
| Hosting | AWS/GCP | $500-2,000 | Load-balanced servers |
| Database | AWS RDS | $200-1,000 | PostgreSQL with replicas |
| Cache | AWS ElastiCache | $100-500 | Redis cluster |
| Email | Resend/SES | $100-500 | Transactional emails |
| Error Tracking | Sentry | $50-100 | Error monitoring |
| Analytics | PostHog | $100-500 | User analytics |
| Monitoring | Datadog | $200-500 | Metrics + logs |
| **Total** | | **$1,270-5,100/month** | |

---

## 8. Technology Radar

### 8.1 Adopt (Use Now)

**Mainstream Technologies:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- Prisma ORM
- PostgreSQL 15+
- Node.js 20+
- Vercel/Supabase

**Rationale:** Proven, stable, great ecosystems

---

### 8.2 Trial (Evaluate for Future)

**Emerging Technologies:**
- **Bun:** Faster Node.js alternative (still experimental)
- **Drizzle ORM:** Lightweight ORM (monitor maturity)
- **HTMX:** For simple interactivity (evaluate for admin dashboards)
- **Biome:** Faster ESLint/Prettier alternative (evaluate stability)

**Rationale:** Promising but need more maturity or validation

---

### 8.3 Assess (Keep Eye On)

**Experimental Technologies:**
- **AI-Native Frameworks:** Vercel AI SDK, LangChain (rapidly evolving)
- **Edge Databases:** Turso, Neon (serverless databases)
- **WebAssembly:** For performance-critical features
- **WebGPU:** For advanced visualizations

**Rationale:** Interesting but not ready for production

---

### 8.4 Avoid (Not Recommended)

**Anti-Patterns for This Project:**
- **Microservices (MVP):** Premature optimization, adds complexity
- **GraphQL (Initially):** Overkill for MVP, REST is simpler
- **Kubernetes (MVP):** Too complex, overkill for <1000 customers
- **NoSQL Databases:** Less suitable for relational data
- **Custom Authentication:** Use NextAuth.js instead
- **Monorepo Tools:** Unnecessary for single project
- **Heavy Frontend Frameworks:** Ember, Angular (less popular now)

**Rationale:** Adds complexity without clear benefits for our use case

---

## 9. Developer Experience Optimization

### 9.1 Local Development Setup

**Goal:** Onboard new developers in <30 minutes

**Setup Script:**

```bash
#!/bin/bash
# scripts/setup.sh

echo "🚀 Setting up SMB AI Orchestration Platform..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 2. Copy environment variables
echo "🔐 Setting up environment variables..."
cp .env.example .env.local

# 3. Setup database
echo "🗄️  Setting up database..."
pnpm prisma migrate dev
pnpm prisma db seed

# 4. Start development server
echo "🎉 Setup complete! Starting development server..."
pnpm dev
```

**One-command setup:**
```bash
curl -sS https://raw.githubusercontent.com/your-repo/main/scripts/setup.sh | bash
```

---

### 9.2 Code Scaffolding

**Use generators for consistency:**

```bash
# Generate new API route
pnpm gen:api workflows

# Generate new component
pnpm gen:component workflow-card

# Generate new integration
pnpm gen:integration gmail
```

---

### 9.3 Documentation Strategy

**Types of Documentation:**

1. **README.md:** Quick start, project overview
2. **CONTRIBUTING.md:** Development setup, guidelines
3. **docs/**: Detailed documentation (architecture, API, etc.)
4. **Code Comments:** Complex logic explanations
5. **JSDoc/TSDoc:** Function documentation with types

**Documentation Tools:**
- **Mintlify:** Beautiful documentation site (API docs)
- **Storybook:** Component documentation and testing
- **TypeDoc:** API documentation from TypeScript

---

## 10. Hiring & Team Considerations

### 10.1 Skills to Look For

**Must-Have Skills:**
- TypeScript/JavaScript (advanced)
- React (2+ years experience)
- Next.js (preferred) or similar frameworks
- PostgreSQL and SQL
- REST API design
- Git workflow

**Nice-to-Have Skills:**
- Serverless/FaaS experience
- AI/ML integration experience
- DevOps experience (AWS/GCP)
- Testing frameworks (Vitest, Playwright)

**Soft Skills:**
- Communication (clear documentation, PR reviews)
- Problem-solving (debugging, optimization)
- Autonomy (self-directed work)
- Learning mindset (new technologies)

---

### 10.2 Training Resources

**For New Team Members:**

1. **Week 1:**
   - Complete local setup
   - Read architecture docs
   - Review codebase
   - Fix a simple bug

2. **Week 2:**
   - Build a small feature
   - Write tests
   - Deploy to preview
   - Code review with senior dev

3. **Week 3-4:**
   - Take ownership of a feature
   - Participate in planning
   - Contribute to documentation
   - Onboard another developer (pay it forward)

---

## 11. Summary & Next Steps

### Technology Stack Summary

**Frontend:**
- Framework: Next.js 14+ (React)
- UI Library: shadcn/ui (Tailwind CSS)
- State: React Query + Zustand
- Forms: React Hook Form + Zod
- Testing: Vitest + Playwright

**Backend:**
- Runtime: Node.js 20+
- Framework: Next.js API Routes
- ORM: Prisma
- Validation: Zod
- Queue: BullMQ (Redis)

**Database:**
- Primary: PostgreSQL (Supabase)
- Cache: Redis (Upstash)
- Storage: S3-compatible (Supabase Storage)

**Infrastructure:**
- Hosting: Vercel (app) + Supabase (database)
- CI/CD: GitHub Actions
- Monitoring: Sentry + Vercel Analytics + PostHog
- Email: Resend

**Development:**
- Language: TypeScript (strict mode)
- Package Manager: pnpm
- Version Control: Git + GitHub
- Linting: ESLint + Prettier

### Next Steps

**Immediate (This Week):**
1. Initialize Next.js project
2. Setup Supabase database
3. Configure ESLint, Prettier, TypeScript
4. Setup GitHub Actions CI/CD
5. Deploy to Vercel (test deployment)

**Short-term (Month 1):**
1. Implement authentication (NextAuth.js)
2. Create database schema with Prisma
3. Build basic UI components (shadcn/ui)
4. Setup error tracking (Sentry)
5. Write initial tests

**Medium-term (Months 2-3):**
1. Build workflow engine
2. Implement integration connectors
3. Create template library
4. Deploy MVP to production
5. Onboard first beta customers

---

**Document Status:** ✅ Complete
**Next Document:** Database Schema (docs/technical/database-schema.md)
**Last Updated:** January 8, 2026
