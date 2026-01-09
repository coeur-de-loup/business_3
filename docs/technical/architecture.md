# System Architecture: Client Portal SaaS for Agencies

**Date:** January 9, 2026
**Status:** Design - Ready for Implementation
**Based On:** Business model and customer requirements

---

## Executive Summary

**Architecture Philosophy:** Simple, scalable, solo-maintainable.

We're building a modern web application with a monolithic architecture that's optimized for:
- Fast development (solo founder)
- Low operational overhead (no DevOps engineer needed)
- Cost efficiency (profitable at 15-20 customers)
- Easy deployment (one-command deploy)
- Simple debugging (single codebase, single deploy unit)

**Architecture Pattern:** Server-Side Rendered (SSR) Web Application with API Routes
- Next.js 14 (App Router, React Server Components)
- PostgreSQL for data persistence
- S3-compatible object storage for files
- Email service for notifications

**Why Monolithic, Not Microservices?**
- Solo founder = limited cognitive load
- Simpler deployment = fewer moving parts to break
- Easier debugging = call stack across all layers
- Faster development = no service boundaries to manage
- Scales to 10,000+ users easily with modern hardware
- Can extract services later if truly needed (unlikely for <2,000 customers)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Clients                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Agency     │  │   Team       │  │   Client     │      │
│  │   Owner      │  │   Member     │  │   (No Auth)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (CDN + Edge)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js Application                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   React     │  │   Server    │  │    API      │  │   │
│  │  │ Components  │  │   Actions   │  │   Routes    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                   │                    │
         ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ PostgreSQL   │    │   S3/R2      │    │   Resend     │
│   (Neon)     │    │  Object Store│    │   Email API  │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## Core Components

### 1. Frontend Layer (Next.js App Router)

**Technology:** Next.js 14 with React Server Components (RSC)

**Responsibilities:**
- Render UI for agency owners, team members, and clients
- Handle client-side interactions (file uploads, comments)
- Server-side rendering for SEO and performance
- Progressive enhancement (works without JavaScript, enhanced with it)

**Key Pages:**
- `/` - Marketing landing page
- `/app` - Main application dashboard (authenticated)
- `/app/portal/[portalId]` - Client portal view
- `/app/settings` - Agency settings and branding
- `/portal/[portalId]/[magicToken]` - Client magic link access

**Why RSC (React Server Components)?**
- Less JavaScript sent to client (faster load)
- Direct database access from components (simpler code)
- Better SEO (server-rendered HTML)
- Improved performance (no client-state hydration issues)

---

### 2. Backend Layer (Next.js API Routes)

**Technology:** Next.js Route Handlers (App Router)

**Responsibilities:**
- RESTful API endpoints for all data operations
- Authentication and authorization checks
- Business logic enforcement
- File upload handling to S3
- Email notification triggers

**API Route Structure:**
```
/api/
├── auth/
│   ├── login         # Agency/team authentication
│   ├── logout        # Session management
│   └── magic-link    # Generate client magic links
├── portals/
│   ├── list          # GET all portals for agency
│   ├── [id]          # GET/PUT/DELETE specific portal
│   └── create        # POST new portal
├── messages/
│   ├── list          # GET messages for portal
│   └── send          # POST new message
├── files/
│   ├── upload        # POST multipart file upload
│   ├── [id]          # GET/DELETE file metadata
│   └── download      # GET file from S3
├── projects/
│   ├── list          # GET projects for portal
│   ├── [id]          # GET/PUT project details
│   └── milestones    # GET/POST milestones
└── webhooks/
    └── stripe        # Stripe subscription webhooks
```

---

### 3. Data Layer (PostgreSQL)

**Technology:** PostgreSQL with Prisma ORM

**Responsibilities:**
- Persistent data storage
- Relational data integrity
- Transaction guarantees
- Query optimization

**Why PostgreSQL?**
- Mature, battle-tested (30+ years)
- Excellent SQL support (joins, aggregations, CTEs)
- JSON support (flexible schema where needed)
- ACID compliance (data integrity)
- Great tooling (Prisma, pgAdmin, cloud providers)
- Scales to millions of records easily
- Free/cheap hosting options (Neon, Supabase, Railway)

---

### 4. File Storage Layer (S3-Compatible)

**Technology:** Cloudflare R2 (S3-compatible API)

**Responsibilities:**
- Store uploaded files (PDFs, images, videos, documents)
- Serve files via CDN
- Handle file versioning
- Generate presigned URLs for secure downloads

**Why Cloudflare R2?**
- S3-compatible API (drop-in replacement)
- No egress fees (unlike AWS S3, which charges for downloads)
- Cheap storage ($0.015/GB/month vs S3's $0.023)
- Global CDN built-in
- Simple, predictable pricing

**Fallback:** AWS S3 if R2 has issues (API-compatible)

---

### 5. Notification Layer (Email Service)

**Technology:** Resend (transactional email API)

**Responsibilities:**
- Send notification emails for new messages
- Send magic links for client access
- Send weekly summaries (optional)
- Handle bounces and delivery issues

**Why Resend?**
- Modern, developer-friendly API
- Generous free tier (3,000 emails/month)
- Good deliverability (uses Sendgrid infrastructure)
- Simple pricing ($20/month for 50,000 emails)
- Good dashboard and analytics

**Fallback:** SendGrid, Postmark, or AWS SES if needed

---

## Authentication & Authorization

### Agency Owner & Team Member Authentication

**Method:** NextAuth.js v5 (Auth.js)

**Flow:**
1. User visits `/app/login`
2. Enters email + password (or magic link)
3. NextAuth verifies credentials against database
4. Session stored in HTTP-only cookie (secure, CSRF-protected)
5. Redirected to `/app` dashboard

**Providers:**
- Email/Password (primary)
- Magic Link (email-based, no password)
- Google OAuth (optional, future feature)

**Session Management:**
- JWT tokens stored in HTTP-only cookies
- 7-day expiration (renewed on activity)
- Server-side session validation on every request

**Why NextAuth.js?**
- Battle-tested (thousands of production apps)
- Handles all OAuth providers (Google, GitHub, etc.)
- Built-in CSRF protection
- Session management out of the box
- TypeScript support
- Free and open-source

---

### Client Authentication (No-Login Model)

**Method:** Magic Links (Token-Based)

**Flow:**
1. Agency owner creates client portal
2. System generates unique magic token: `portalId_token_randomString`
3. Agency owner sends link to client: `/portal/[portalId]/[token]`
4. Client clicks link → system validates token
5. If valid, client can view portal (no account required)
6. Token expires after 30 days (configurable)
7. Agency owner can revoke tokens

**Security Model:**
- Tokens stored in database (can be revoked)
- One-time use or multi-use (configurable)
- IP-agnostic (works from any device)
- No password needed (reduces friction)

**Why This Approach?**
- Clients hate creating accounts (high friction)
- Email notifications drive engagement anyway
- Simpler UX: "Click link to view portal"
- Sufficient security: If token compromised, regenerate
- Industry standard: Used by Calendly, DocuSign, etc.

---

## Data Models & Relationships

### Core Entities

**Users** (Agency owners + team members)
- `id`, `email`, `passwordHash`, `name`, `role`, `agencyId`
- One user belongs to one agency
- Roles: `OWNER`, `ADMIN`, `MEMBER`

**Agencies**
- `id`, `name`, `slug`, `logoUrl`, `domain` (custom), `planId`, `stripeCustomerId`
- One agency has many users
- One agency has many portals
- One agency has one subscription

**Portals** (Client project spaces)
- `id`, `agencyId`, `clientName`, `clientEmail`, `title`, `description`, `status`, `theme`
- One portal belongs to one agency
- One portal has many messages
- One portal has many files
- One portal has one project (with milestones)

**Messages**
- `id`, `portalId`, `senderId` (user or client), `content`, `readAt`, `createdAt`
- One message belongs to one portal
- Messages can be sent by agency users or clients

**Files**
- `id`, `portalId`, `uploadedById`, `filename`, `s3Key`, `size`, `mimeType`, `version`, `createdAt`
- One file belongs to one portal
- Files stored in S3, metadata in PostgreSQL

**Projects** (Optional: Milestones and timeline)
- `id`, `portalId`, `name`, `description`, `status`, `startDate`, `endDate`
- One project belongs to one portal
- One project has many milestones

**Milestones**
- `id`, `projectId`, `title`, `description`, `status`, `dueDate`, `completedAt`
- One milestone belongs to one project
- Status: `PENDING`, `IN_PROGRESS`, `COMPLETED`

**Subscriptions** (Stripe integration)
- `id`, `agencyId`, `stripeSubscriptionId`, `status`, `currentPeriodEnd`, `cancelAtPeriodEnd`
- One subscription belongs to one agency
- Tracks billing status

**Usage** (For tier limits)
- `id`, `agencyId`, `metric` (e.g., `activePortals`), `count`, `month`, `year`
- Tracks usage against plan limits (3 portals for Starter, 25 for Pro, etc.)

---

### Database Schema Diagram

```
┌─────────────┐         ┌─────────────┐
│   Agencies  │──────1  │  Users      │
│             │         │             │
│ id          │         │ id          │
│ name        │         │ email       │
│ logoUrl     │         │ agencyId    │
│ domain      │    N────│ role        │
│ planId      │         │             │
└─────────────┘         └─────────────┘
       │
       │ 1
       │
       │ N
┌─────────────┐         ┌─────────────┐
│  Portals    │──────1  │  Projects   │
│             │         │             │
│ id          │    1────│ id          │
│ agencyId    │         │ portalId    │
│ clientName  │         │ name        │
│ title       │    N────│ status      │
│ status      │         │             │
└─────────────┘         └─────────────┘
       │                       │ 1
       │ 1                     │
       │                       │ N
       │ N                ┌─────────────┐
┌─────────────┐            │ Milestones  │
│  Messages   │            │             │
│             │            │ id          │
│ id          │            │ projectId   │
│ portalId    │            │ title       │
│ senderId    │            │ status      │
│ content     │            │ dueDate     │
│ readAt      │            │             │
└─────────────┘            └─────────────┘

┌─────────────┐         ┌─────────────┐
│    Files    │         │Subscriptions│
│             │         │             │
│ id          │         │ id          │
│ portalId    │    1────│ agencyId    │
│ s3Key       │         │ status      │
│ version     │         │ stripeSubId │
│             │         │             │
└─────────────┘         └─────────────┘
```

---

## Security Model

### Authentication Security

**Password Storage:**
- Hashed with bcrypt (cost factor 12)
- Salted automatically (bcrypt built-in)
- Never store plain-text passwords

**Session Security:**
- HTTP-only cookies (cannot be accessed by JavaScript)
- Secure flag (HTTPS only)
- SameSite flag (CSRF protection)
- Short expiration (7 days, renewable)

**Magic Link Security:**
- Cryptographically random tokens (256 bits)
- Single-use tokens (deleted after use)
- Expiration after 30 days
- Revocable by agency owner

---

### Authorization Security

**Role-Based Access Control (RBAC):**

| Role | Permissions |
|------|-------------|
| **OWNER** | Full access to agency data, billing, team management |
| **ADMIN** | Full access to portals, messages, files; no billing |
| **MEMBER** | Access to assigned portals only; cannot delete |
| **CLIENT** | Read-only access to specific portal; can comment; no deletion |

**Data Isolation:**
- Every query scoped to `agencyId` (multi-tenant architecture)
- Users can only access data from their agency
- Clients can only access their specific portal
- No cross-agency data access possible

---

### API Security

**Rate Limiting:**
- API routes: 100 requests/minute per user
- File uploads: 10 uploads/minute per user
- Auth endpoints: 5 requests/minute per IP (prevent brute force)
- Implemented with Vercel's edge rate limiting

**Input Validation:**
- Zod schemas for all API inputs
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React escapes by default)
- File type validation (allow-list, not block-list)
- File size limits (e.g., 50MB per file)

**HTTPS Enforcement:**
- All traffic over HTTPS only
- HTTP requests auto-redirected to HTTPS
- HSTS headers enabled

---

### File Storage Security

**Upload Security:**
- File type validation (allow-list: pdf, doc, docx, jpg, png, etc.)
- File size limits (configurable per plan)
- Virus scanning (optional, Cloudflare R2 has built-in malware protection)
- Presigned URLs (time-limited access tokens)

**Access Control:**
- Files stored in private buckets (no public access)
- Presigned URLs expire after 1 hour
- Direct S3 access (files don't pass through our servers)
- Access logged (who downloaded what, when)

---

## Infrastructure & Deployment

### Hosting Provider: Vercel

**Why Vercel?**
- Built by Next.js creators (best-in-class Next.js support)
- Zero-config deployment (git push → deployed)
- Automatic SSL certificates (HTTPS by default)
- Global CDN (fast page loads worldwide)
- Edge functions (API routes run close to users)
- Generous free tier (then $20/month for Pro)
- Preview deployments (test changes before merging)
- Analytics built-in (no extra setup needed)

**Deployment Architecture:**
```
Git Push (GitHub)
        │
        ▼
Vercel Build
        │
        ├─► Build Next.js app
        ├─► Run tests (if configured)
        ├─► Optimize assets
        └─► Deploy to edge network
                │
                ▼
          Global CDN
       (50+ locations worldwide)
                │
                ▼
          User Request
      (served from nearest edge)
```

---

### Database Hosting: Neon

**Why Neon?**
- PostgreSQL-compatible (100% compatibility)
- Serverless (pay only for what you use)
- Auto-scaling (handles traffic spikes automatically)
- Branching (git-like database branches for dev/staging/prod)
- Generous free tier (then $25/month for Pro)
- Easy integration with Prisma
- Backups and point-in-time recovery included
- Vercel integration (one-click setup)

**Database Architecture:**
- **Primary database:** Production (US East)
- **Branch databases:** Development, testing, feature branches
- **Connection pooling:** Neon handles automatically
- **Read replicas:** Not needed initially (add later if slow queries)

---

### File Storage: Cloudflare R2

**Why R2?**
- S3-compatible API (drop-in replacement)
- No egress fees (save money on downloads)
- Cheap storage ($0.015/GB vs S3's $0.023)
- Global CDN included
- Simple, predictable pricing

**Storage Architecture:**
- **Bucket:** `client-portal-production`
- **Path structure:** `{agencyId}/{portalId}/{fileId}/{filename}`
- **Versioning:** Enabled (keep file history)
- **Lifecycle rules:** Delete old versions after 90 days (save costs)

---

### Email Service: Resend

**Why Resend?**
- Modern, developer-friendly API
- Generous free tier (3,000 emails/month)
- Good deliverability (uses Sendgrid infrastructure)
- Simple pricing ($20/month for 50,000 emails)
- Good dashboard and analytics
- Easy to integrate with Next.js

**Email Templates:**
- New message notification
- Magic link (for client access)
- Weekly summary (optional)
- Trial expiration reminder
- Subscription receipt

---

### Monitoring & Observability

**Application Monitoring:**
- **Vercel Analytics:** Built-in page views, Core Web Vitals
- **Vercel Log Drains:** Send logs to external service (optional)
- **Sentry:** Error tracking (free tier covers small apps)
- **Custom logging:** Structured logs (JSON) for debugging

**Business Metrics:**
- **Active users:** DAU, MAU (track via database)
- **Portal engagement:** Messages sent, files uploaded
- **Conversion:** Trial → paid conversion rate
- **Churn:** Cancellation rate
- **LTV:** Customer lifetime value (calculate via Stripe)

**Uptime Monitoring:**
- **UptimeRobot:** Free tier (checks every 5 minutes)
- **Status page:** Optional (for transparency)
- **Alerts:** Email/SMS if site goes down

---

## Scalability Strategy

### Vertical Scaling (First 6 Months)

**Handles:** Up to 1,000 users, 10,000 portals

**Approach:** Upgrade Vercel and Neon plans
- Vercel Pro ($20/month)
- Neon Pro ($25/month)
- More CPU, RAM, storage
- No code changes needed

---

### Horizontal Scaling (6-18 Months)

**Handles:** 1,000-10,000 users, 100,000 portals

**Approach:**
- Vercel handles automatically (scales to millions of requests)
- Neon scales automatically (serverless PostgreSQL)
- Add read replicas if queries slow (Neon supports)
- Cache frequently-accessed data (Redis)

**When to Add Redis:**
- Session storage (if server-side sessions slow)
- API response caching (portal list, user profile)
- Rate limiting counters
- Cost: $5-20/month (Redis Cloud or Upstash)

---

### Beyond 10,000 Users (18+ Months)

**If Needed:**
- Database sharding (split data by agencyId)
- Separate read/write databases (Neon read replicas)
- CDN caching for static assets (Vercel already does this)
- Optimize queries (add indexes, refactor slow queries)

**Likely Not Needed:**
- Most agencies don't need >10,000 users to be profitable
- At 500 customers × $68/month = $34,000 MRR (very profitable)
- Keep it simple until you have real scaling problems

---

## Development Workflow

### Local Development Setup

```bash
# 1. Clone repository
git clone github.com/yourname/client-portal.git
cd client-portal

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys (Neon, R2, Resend, Stripe)

# 4. Set up database
npx prisma migrate dev
npx prisma db seed  # Seed sample data

# 5. Run development server
npm run dev
# App runs at http://localhost:3000
```

---

### Git Workflow

**Branching Strategy:** GitHub Flow (simple)

```
main (production)
  │
  ├─► feature/add-messaging
  ├─► bugfix/file-upload-error
  ├─► chore/update-dependencies
  └─► refactor/auth-flow
```

**Workflow:**
1. Create branch from `main`
2. Make changes, commit
3. Push to GitHub
4. Vercel auto-deploys preview URL
5. Test on preview URL
6. Create pull request
7. Review and merge to `main`
8. Vercel auto-deploys to production

---

### Testing Strategy

**Unit Tests (Jest + React Testing Library):**
- Business logic (e.g., format file size, calculate expiry)
- React components (e.g., FileUpload, MessageList)
- Utility functions (e.g., validateEmail, generateToken)

**Integration Tests (Playwright):**
- Critical user flows:
  - Agency owner creates portal
  - Client views portal via magic link
  - File upload and download
  - Message sending

**Coverage Goal:** 70-80% (focus on business logic, not UI)

---

## Failure Modes & Recovery

### Database Outage (Neon Down)

**Impact:** Users cannot access data, app unusable

**Detection:** Sentry errors, Vercel logs, UptimeRobot alerts

**Recovery:**
- Neon has 99.95% uptime (4.38 hours downtime/year)
- Automatic failover built into Neon
- Data backed up continuously (point-in-time recovery)
- Restore from backup if needed (RTO: <1 hour)

**Prevention:**
- Monitor database health (Neon dashboard)
- Use read replicas to reduce load on primary
- Optimize slow queries (reduce load)

---

### File Storage Outage (R2 Down)

**Impact:** Users cannot upload/download files

**Detection:** File upload errors, download failures

**Recovery:**
- R2 has 99.99% uptime (43 minutes downtime/year)
- Automatic failover to secondary region (Cloudflare handles)
- If persistent: switch to AWS S3 (API-compatible)

**Prevention:**
- Multi-region replication (Cloudflare does this)
- Cache frequently-accessed files (CDN)

---

### Email Service Outage (Resend Down)

**Impact:** Users don't receive notifications

**Detection:** Bounce notifications, delivery failures

**Recovery:**
- Queue emails (retry later)
- Switch to backup provider (SendGrid, Postmark)
- Fallback: In-app notifications only

**Prevention:**
- Use multiple email providers (redundancy)
- Handle bounces gracefully (mark emails as invalid)

---

### Payment Processing Issues (Stripe Down)

**Impact:** Users cannot upgrade/downgrade subscriptions

**Detection:** Stripe webhook failures, payment errors

**Recovery:**
- Stripe has 99.99% uptime (very reliable)
- Graceful degradation: allow access during outage
- Retry failed payments automatically (Stripe handles)
- If extended outage: manual subscription management

**Prevention:**
- Listen to Stripe webhooks (async updates)
- Handle idempotency (retry-safe operations)
- Log all payment events for audit

---

### Deployment Failures (Vercel Deploy Broken)

**Impact:** New version has bugs, production broken

**Detection:** Error spike in Sentry, user reports

**Recovery:**
- Vercel supports instant rollback (one click)
- Rollback to previous working version
- Fix bug, test, redeploy

**Prevention:**
- Preview deployments (test before merging)
- Automated tests (catch bugs before deploy)
- Gradual rollout (canary releases, if needed)

---

## Disaster Recovery & Backups

### Database Backups

**Automated Backups:**
- Neon provides continuous backups (point-in-time recovery)
- Retention: 7 days (free tier), 30 days (Pro tier)
- No manual backup needed

**Manual Backups (Optional):**
```bash
# Dump database to SQL file
npx prisma db pull --schema=./prisma/schema.prisma

# Upload to S3 for long-term storage
aws s3 cp backup.sql s3://backups/client-portal-$(date +%Y%m%d).sql
```

---

### Disaster Recovery Plan

**Scenario 1: Accidental Data Deletion**
- Recovery time: <5 minutes
- Use Neon point-in-time recovery (restore to before deletion)
- No data loss

**Scenario 2: Malicious Attack (Compromised Account)**
- Recovery time: <1 hour
- Revoke all API keys
- Change all passwords
- Restore database to last known good state
- Audit logs to identify breach
- Implement additional security measures

**Scenario 3: Vercel/Neon永久性故障**
- Recovery time: <4 hours
- Deploy to alternative provider (Railway, Render)
- Restore database from latest backup
- Update DNS to point to new deployment
- Notify users of brief outage

---

## Cost Optimization

### Current Monthly Costs (Month 1-6)

| Service | Plan | Cost |
|---------|------|------|
| Vercel (hosting) | Free → Pro | $0 → $20 |
| Neon (database) | Free → Pro | $0 → $25 |
| Cloudflare R2 (files) | Pay-as-you-go | $0-10 |
| Resend (email) | Free → Pay-as-you-go | $0-20 |
| Sentry (errors) | Free | $0 |
| Stripe (payments) | Pay-as-you-go | 2.9% + $0.30/transaction |
| **Total** | | **$0-75/month** |

### At 15 Customers ($1,000 MRR)

| Service | Cost |
|---------|------|
| Infrastructure (Vercel + Neon + R2 + Resend) | $75 |
| Stripe fees (15 × $68 × 2.9% + $0.30) | $33 |
| **Total Costs** | **$108/month** |
| **Revenue** | **$1,020/month** |
| **Profit** | **$912/month** ✅ |

### At 100 Customers ($6,800 MRR)

| Service | Cost |
|---------|------|
| Infrastructure (Scales) | $200-300 |
| Stripe fees (100 transactions) | $225 |
| **Total Costs** | **$425-525/month** |
| **Revenue** | **$6,800/month** |
| **Profit** | **$6,275-6,375/month** ✅ |

**Key Insight:** Costs scale linearly, revenue scales linearly. Margins stay high (80-90%).

---

## Performance Optimization

### Frontend Performance

**Next.js Optimizations:**
- Server-side rendering (SSR) for fast initial load
- Static generation where possible (marketing pages)
- Image optimization (Next.js Image component)
- Code splitting (automatic in Next.js)
- Lazy loading (React.lazy, Next.js dynamic imports)
- Font optimization (next/font)

**Target Metrics:**
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Cumulative Layout Shift (CLS): <0.1
- First Input Delay (FID): <100ms

---

### Backend Performance

**Database Optimizations:**
- Indexes on frequently-queried columns (agencyId, portalId)
- Query optimization (use `select`, avoid `select *`)
- Connection pooling (Neon handles automatically)
- Read replicas (if queries slow)

**API Optimizations:**
- Pagination (don't load 10,000 messages at once)
- Caching (Redis for frequently-accessed data)
- Compression (gzip, brotli - Vercel handles)
- CDN caching for static assets

**Target Metrics:**
- API response time (p95): <200ms
- Database query time (p95): <50ms
- File upload speed: 10MB in <5s

---

## Next Steps

### Immediate (This Week)
1. ✅ Complete technical architecture document (this document)
2. ⬜ Create database schema (Prisma schema)
3. ⬜ Set up Vercel project
4. ⬜ Set up Neon database
5. ⬜ Set up Cloudflare R2 bucket
6. ⬜ Set up Resend account

### Short-Term (Next 2 Weeks)
7. ⬜ Create Next.js project skeleton
8. ⬜ Implement authentication (NextAuth.js)
9. ⬜ Build basic UI shell (dashboard, navigation)
10. ⬜ Implement agency/portal CRUD operations
11. ⬜ Integrate S3 file upload/download
12. ⬜ Implement messaging system

### Medium-Term (Next Month)
13. ⬜ Implement magic link client access
14. ⬜ Build email notification system
15. ⬜ Implement Stripe subscription flow
16. ⬜ Add project milestones feature
17. ⬜ Polish UI/UX
18. ⬜ Beta testing with friendly agencies
19. ⬜ Bug fixes and performance optimization

---

**Document Status:** ✅ Complete
**Next Document:** Database Schema (docs/technical/database-schema.md)
**Last Updated:** January 9, 2026
