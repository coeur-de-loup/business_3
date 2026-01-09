# Database Schema: SMB AI Orchestration Platform

**Date:** January 8, 2026
**Status:** Draft - MVP Schema
**Version:** 1.0
**Architect:** Code Architect Agent

---

## Executive Summary

This document defines the database schema for the SMB AI Orchestration Platform using PostgreSQL with Prisma ORM.

**Design Principles:**
- **Normalization:** 3NF to reduce redundancy
- **Performance:** Strategic indexes, query optimization
- **Scalability:** Partitioning strategy for large tables
- **Flexibility:** JSONB fields for evolving data
- **Security:** Row-level security, encrypted sensitive data

**Key Entities:**
- **Users & Organizations:** Multi-tenant authentication
- **Workflows:** Core product (definitions, executions)
- **Integrations:** External service connections
- **Templates:** Prebuilt workflow library
- **Usage & Billing:** Track consumption, subscriptions

---

## 1. Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  User        │         │ Organization │         │  Workflow    │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ id (PK)      │    N:1  │ id (PK)      │     1:N │ id (PK)      │
│ email        │◀───────│ name         │─────────▶│ name         │
│ name         │         │ plan         │         │ definition   │
│ role         │         │ stripeCustomerId        │ organization │
│ passwordHash │         └──────────────┘         │ status       │
│ organization │◀────────                        └──────────────┘
└──────────────┘   1:N                                 │
       │                                               │ 1:N
       │                                               ▼
       │                                         ┌──────────────┐
       │                                         │ Execution    │
       │                                         ├──────────────┤
       │                                         │ id (PK)      │
       │                                         │ workflowId   │
       │                                         │ status       │
       │                                         │ startedAt    │
       │                                         │ completedAt  │
       │                                         │ result       │
       │                                         │ error        │
       │                                         └──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Integration  │         │  Template    │         │ ExecutionLog │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ id (PK)      │         │ id (PK)      │         │ id (PK)      │
│ organization │         │ name         │         │ executionId  │
│ provider     │         │ category     │         │ stepId       │
│ credentials  │         │ definition   │         │ level        │
│ settings     │         │ author       │         │ message      │
│ status       │         │ popularity   │         │ timestamp    │
└──────────────┘         │ isPublic     │         └──────────────┘
                         └──────────────┘
```

---

## 2. Core Schema (Prisma)

### 2.1 Users & Authentication

```prisma
// prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  role          UserRole  @default(MEMBER)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  organization  Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId String
  createdWorkflows Workflow[] @relation("CreatedBy")
  executions      Execution[]

  @@index([organizationId])
  @@index([email])
}

enum UserRole {
  OWNER    // Full access, billing management
  ADMIN    // All features except billing
  MEMBER   // Access to assigned workflows
  VIEWER   // Read-only access
}
```

**Design Decisions:**
- **Multi-tenant:** Users belong to organizations (not individual accounts)
- **Role-based:** RBAC for fine-grained permissions
- **Soft delete:** Not used (hard delete for compliance, audit logs separate)
- **Indexes:** Email (login lookups), organizationId (user list)

---

### 2.2 Organizations (Tenants)

```prisma
model Organization {
  id                String    @id @default(cuid())
  name              String
  plan              Plan      @default(STARTER)
  stripeCustomerId String?   @unique
  trialEndsAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  users        User[]
  workflows    Workflow[]
  integrations Integration[]
  usageRecords UsageRecord[]
  subscriptions Subscription[]

  @@index([plan])
  @@index([stripeCustomerId])
}

enum Plan {
  STARTER      // $49/month - 5 workflows, 3 integrations
  PROFESSIONAL // $99/month - 25 workflows, 10 integrations
  ENTERPRISE   // $299+/month - unlimited
}
```

**Design Decisions:**
- **Billing entity:** Organization is the customer (not individual users)
- **Plan-based:** Different limits per tier
- **Stripe integration:** Customer ID for subscriptions
- **Trial support:** trialEndsAt for trial period

---

### 2.3 Workflows

```prisma
model Workflow {
  id           String      @id @default(cuid())
  name         String
  description  String?
  category     WorkflowCategory
  definition   Json        // Workflow DSL (JSON)
  status       WorkflowStatus @default(ACTIVE)
  isTemplate   Boolean     @default(false)
  schedule     Json?       // Cron expression or interval
  triggers     Json?       // Webhook, manual, scheduled

  // Metadata
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId String
  createdBy    User?       @relation("CreatedBy", fields: [createdById], references: [id])
  createdById  String?
  executions   Execution[]

  @@index([organizationId])
  @@index([status])
  @@index([category])
  @@index([createdAt])
}

enum WorkflowCategory {
  MARKETING        // Email campaigns, social media
  SALES            // CRM follow-ups, lead scoring
  OPERATIONS       // Scheduling, reporting, data entry
  CUSTOMER_SUPPORT // Ticket triage, responses
  ADMIN            // Invoicing, notifications
  CUSTOM           // User-defined
}

enum WorkflowStatus {
  ACTIVE          // Enabled and running
  PAUSED          // Temporarily disabled
  ARCHIVED        // Not in use, kept for history
  DRAFT           // Still being built
}
```

**Design Decisions:**
- **JSONB definition:** Flexible workflow DSL, no schema migrations needed
- **Category:** For template library and organization
- **Versioning:** Not initially (can add later if needed)
- **Soft delete:** Archived status instead of hard delete
- **Triggers:** Support for manual, scheduled, webhook triggers

---

### 2.4 Workflow Executions

```prisma
model Execution {
  id          String        @id @default(cuid())
  status      ExecutionStatus @default(PENDING)
  startedAt   DateTime      @default(now())
  completedAt DateTime?
  duration    Int?          // Milliseconds

  // Input & Output
  input       Json?         // Initial input data
  output      Json?         // Final result
  error       Json?         // Error details if failed
  result      ExecutionResult @default(PENDING)

  // Metadata
  triggeredBy TriggeredBy @default(MANUAL)
  triggeredByUserId String?
  webhookEventId String?

  // Relations
  workflow    Workflow      @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  workflowId  String
  user        User?         @relation(fields: [userId], references: [id])
  userId      String?
  logs        ExecutionLog[]

  @@index([workflowId])
  @@index([status])
  @@index([startedAt])
  @@index([userId])
}

enum ExecutionStatus {
  PENDING     // Queued, waiting to start
  RUNNING     // Currently executing
  WAITING     // Awaiting human input or external event
  COMPLETED   // Finished successfully
  FAILED      // Error occurred
  CANCELLED   // User cancelled
  TIMEOUT     // Exceeded max duration
}

enum ExecutionResult {
  PENDING     // Not yet determined
  SUCCESS     // Completed without errors
  PARTIAL     // Some steps failed
  FAILURE     // All steps failed
  CANCELLED   // User cancelled
}

enum TriggeredBy {
  MANUAL      // User clicked "Run"
  SCHEDULE    // Cron/schedule triggered
  WEBHOOK     // External webhook
  API         // API call
}
```

**Design Decisions:**
- **Execution tracking:** Every workflow run creates an execution record
- **Status tracking:** PENDING → RUNNING → COMPLETED/FAILED
- **Error details:** JSON field for flexible error information
- **Duration tracking:** For performance monitoring and billing
- **Retention policy:** Delete logs after 30-90 days (configurable)

---

### 2.5 Execution Logs

```prisma
model ExecutionLog {
  id        String     @id @default(cuid())
  level     LogLevel
  stepId    String?    // Which step generated this log
  message   String
  metadata  Json?      // Additional context
  timestamp DateTime   @default(now())

  // Relations
  execution Execution  @relation(fields: [executionId], references: [id], onDelete: Cascade)
  executionId String

  @@index([executionId])
  @@index([timestamp])
  @@index([level])
}

enum LogLevel {
  DEBUG
  INFO
  WARN
  ERROR
  CRITICAL
}
```

**Design Decisions:**
- **Structured logs:** JSON metadata for querying
- **Step-level:** Track which step generated each log
- **Log levels:** DEBUG, INFO, WARN, ERROR, CRITICAL
- **Retention:** Delete after 30 days (configurable)

---

### 2.6 Integrations

```prisma
model Integration {
  id          String           @id @default(cuid())
  provider    IntegrationProvider
  credentials Json?            // Encrypted OAuth tokens, API keys
  settings    Json?            // User preferences per integration
  status      IntegrationStatus @default(ACTIVE)
  lastUsedAt  DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  // Metadata
  webhookUrl  String?          // For incoming webhooks

  // Relations
  organization Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId String

  @@index([organizationId])
  @@index([provider])
  @@index([status])
}

enum IntegrationProvider {
  // AI Providers
  OPENAI
  ANTHROPIC
  GOOGLE_GEMINI
  COHERE

  // Communication
  SLACK
  MICROSOFT_TEAMS
  DISCORD

  // Email
  GMAIL
  OUTLOOK
  SENDGRID
  RESEND

  // CRM & Sales
  HUBSPOT
  SALESFORCE
  PIPEDRIVE

  // Project Management
  TRELLO
  ASANA
  MONDAY
  NOTION
  LINEAR

  // E-commerce
  SHOPIFY
  WOO_COMMERCE
  SQUARE

  // Marketing
  MAILCHIMP
  CONVERTKIT
  ACTIVECAMPAIGN

  // Payments
  STRIPE
  PAYPAL

  // Scheduling
  CALENDLY
  ACUITY

  // Automation Platforms
  ZAPIER
 _MAKE

  // Spreadsheets
  GOOGLE_SHEETS
  AIRTABLE
}

enum IntegrationStatus {
  ACTIVE       // Working normally
  EXPIRED      // OAuth token expired
  ERROR        // Connection error
  DISABLED     // User disabled
}
```

**Design Decisions:**
- **Encrypted credentials:** Store OAuth tokens/API keys encrypted (AES-256)
- **Provider enum:** All supported integrations
- **Settings:** User preferences per integration (webhooks, notifications)
- **Status tracking:** Monitor integration health
- **Webhook support:** URL for incoming webhooks from external services

---

### 2.7 Templates

```prisma
model Template {
  id          String           @id @default(cuid())
  name        String
  description String
  category    WorkflowCategory
  tags        String[]         // For search/discovery
  difficulty  TemplateDifficulty @default(BEGINNER)
  estimatedTimeSavings String  // e.g., "2 hours/week"

  // Workflow Definition
  definition  Json             // Prebuilt workflow DSL

  // Configuration
  requiredIntegrations String[] // List of IntegrationProvider enums
  optionalIntegrations String[]
  configurationSchema  Json?    // JSON Schema for user inputs

  // Metadata
  author      TemplateAuthor @default(OFFICIAL)
  isPublic    Boolean @default(true)
  popularity  Int @default(0)   // Usage count
  rating      Float @default(0) // Average user rating (1-5)
  ratingCount Int @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([author])
  @@index([popularity])
  @@index([rating])
}

enum TemplateDifficulty {
  BEGINNER     // No technical skills required
  INTERMEDIATE // Some configuration needed
  ADVANCED     // Requires technical knowledge
}

enum TemplateAuthor {
  OFFICIAL     // Created by our team
  COMMUNITY    // Created by users
}
```

**Design Decisions:**
- **Separate from workflows:** Templates are definitions, not instances
- **Popularity tracking:** Track usage for sorting
- **Ratings:** User feedback for quality
- **Community submissions:** Users can submit templates (future feature)

---

### 2.8 Usage & Billing

```prisma
model UsageRecord {
  id              String    @id @default(cuid())
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId  String

  // Usage Metrics
  metric          UsageMetric
  quantity        Int       // Number of units used
  cost            Float?    // Actual cost (if applicable)

  // Time Period
  periodStart     DateTime
  periodEnd       DateTime

  // Metadata
  details         Json?     // Additional context

  createdAt       DateTime  @default(now())

  @@unique([organizationId, metric, periodStart, periodEnd])
  @@index([organizationId])
  @@index([periodStart, periodEnd])
}

enum UsageMetric {
  WORKFLOW_EXECUTIONS    // Number of workflow runs
  AI_TOKENS_USED         // Total AI tokens consumed
  API_CALLS_MADE         // External API calls
  STORAGE_GB             // Storage used
  ACTIVE_USERS           // Active users in period
  ACTIVE_WORKFLOWS       // Active workflows count
}

model Subscription {
  id              String          @id @default(cuid())
  organization    Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  organizationId  String

  // Stripe Details
  stripeSubscriptionId String?   @unique
  stripePriceId        String?

  // Plan Details
  plan            Plan
  status          SubscriptionStatus
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime

  // Cancel/Resume
  cancelAt        DateTime?      // Scheduled cancellation
  cancelAtPeriodEnd Boolean @default(false)

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([organizationId])
  @@index([status])
  @@index([stripeSubscriptionId])
}

enum SubscriptionStatus {
  ACTIVE         // Subscription is active
  TRIALING       // In trial period
  PAST_DUE       // Payment failed
  CANCELLED      // Cancelled by user
  UNPAID         // Payment pending
  INCOMPLETE     // Initial payment failed
}
```

**Design Decisions:**
- **Usage tracking:** Per-organization usage metrics for billing
- **Time periods:** Daily, monthly records for accurate billing
- **Stripe integration:** Sync subscription status
- **Flexible metrics:** Easy to add new metrics

---

## 3. Indexing Strategy

### 3.1 Primary Indexes

```prisma
// All primary keys are indexed automatically
id String @id @default(cuid())
```

**Rationale:** CUIDs are distributed, collision-resistant, and performant

---

### 3.2 Foreign Key Indexes

```prisma
// Join performance (many queries filter by these)
@@index([organizationId])
@@index([workflowId])
@@index([userId])
@@index([executionId])
```

**Rationale:**
- Most queries filter by organization (multi-tenant)
- Workflow executions commonly filtered by workflow
- User activity queries by userId

---

### 3.3 Query-Specific Indexes

**Common Query Patterns:**

```sql
-- 1. List active workflows (dashboard)
CREATE INDEX idx_workflow_status_org
ON Workflow(organizationId, status)
WHERE status = 'ACTIVE';

-- 2. Execution history (performance)
CREATE INDEX idx_execution_workflow_started
ON Execution(workflowId, startedAt DESC);

-- 3. Recent executions (activity feed)
CREATE INDEX idx_execution_org_started
ON Execution(organizationId, startedAt DESC)
WHERE startedAt > NOW() - INTERVAL '30 days';

-- 4. Usage records (billing)
CREATE INDEX idx_usage_org_period
ON UsageRecord(organizationId, periodStart DESC, periodEnd DESC);

-- 5. Template discovery (library)
CREATE INDEX idx_template_category_rating
ON Template(category, rating DESC, popularity DESC)
WHERE isPublic = true;
```

**Rationale:**
- Composite indexes for common filter combinations
- Descending indexes for time-series data (recent first)
- Partial indexes (WHERE clause) for smaller index size

---

### 3.4 Full-Text Search

```sql
-- Workflow search
CREATE INDEX idx_workflow_name_fts
ON Workflow USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Template search
CREATE INDEX idx_template_fts
ON Template USING gin(to_tsvector('english', name || ' ' || description || ' ' || array_to_string(tags, ' ')));
```

**Rationale:**
- PostgreSQL full-text search for workflow/template discovery
- GIN indexes for fast text search
- English language configuration

---

## 4. Data Partitioning (Year 2+)

### 4.1 Partition Large Tables

**Candidate Tables:**
- **Execution:** Fast-growing, time-series data
- **ExecutionLog:** Very fast-growing, log data
- **UsageRecord:** Time-series billing data

**Partitioning Strategy (Execution):**

```sql
-- Partition by month (Year 2: 1,000-10,000 executions/day)
CREATE TABLE execution_2026_01 PARTITION OF Execution
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE execution_2026_02 PARTITION OF Execution
FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Repeat for each month
```

**Benefits:**
- Faster queries (scan only relevant partitions)
- Easier maintenance (drop old partitions)
- Better performance (smaller indexes per partition)

**Trigger for Partition Creation:**

```sql
-- Auto-create future partitions
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
  partition_date text;
  start_date text;
  end_date text;
BEGIN
  partition_date := to_char(NOW() + INTERVAL '1 month', 'YYYY_MM');
  start_date := to_char(date_trunc('month', NOW() + INTERVAL '1 month'), 'YYYY-MM-DD');
  end_date := to_char(date_trunc('month', NOW() + INTERVAL '2 months'), 'YYYY-MM-DD');

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS execution_%s PARTITION OF Execution FOR VALUES FROM (%L) TO (%L)',
    partition_date, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Data Retention & Cleanup

### 5.1 Retention Policies

```sql
-- 1. Execution logs: 30 days
DELETE FROM ExecutionLog
WHERE timestamp < NOW() - INTERVAL '30 days';

-- 2. Successful executions: 90 days
DELETE FROM Execution
WHERE status = 'COMPLETED'
AND completedAt < NOW() - INTERVAL '90 days';

-- 3. Failed executions: 180 days (keep longer for debugging)
DELETE FROM Execution
WHERE status = 'FAILED'
AND completedAt < NOW() - INTERVAL '180 days';

-- 4. Usage records: 2 years (for billing and analytics)
DELETE FROM UsageRecord
WHERE periodEnd < NOW() - INTERVAL '2 years';
```

---

### 5.2 Automated Cleanup

**Prisma Migration (Add cleanup jobs):**

```typescript
// scripts/cleanup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOldRecords() {
  // 1. Delete old execution logs
  const deletedLogs = await prisma.executionLog.deleteMany({
    where: {
      timestamp: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    },
  });

  // 2. Delete old successful executions
  const deletedExecutions = await prisma.execution.deleteMany({
    where: {
      status: 'COMPLETED',
      completedAt: {
        lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    },
  });

  console.log(`Deleted ${deletedLogs.count} logs`);
  console.log(`Deleted ${deletedExecutions.count} executions`);
}

// Run daily
cleanupOldRecords();
```

**Schedule with Cron (Vercel Cron Jobs):**

```typescript
// app/api/cron/cleanup/route.ts
export async function GET() {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await cleanupOldRecords();
  return new Response('Cleanup complete');
}
```

**Vercel Cron Configuration:**

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/cleanup",
    "schedule": "0 2 * * *"
  }]
}
```

---

## 6. Security & Encryption

### 6.1 Sensitive Data Encryption

**Encryption at Rest:**

```typescript
// lib/crypto.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**Usage:**

```typescript
// When storing credentials
const encryptedCredentials = encrypt(JSON.stringify({
  accessToken: '...',
  refreshToken: '...',
}));

await prisma.integration.create({
  data: {
    provider: 'SLACK',
    credentials: encryptedCredentials, // Encrypted
  },
});

// When reading credentials
const integration = await prisma.integration.findUnique({ where: id });
const credentials = JSON.parse(decrypt(integration.credentials));
```

---

### 6.2 Row-Level Security

**Organization Isolation:**

```typescript
// Middleware to ensure organization isolation
export async function getPrismaForOrganization(orgId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ operation, model, args, query }) {
        // Automatically filter by organization
        if (['Workflow', 'Integration', 'User'].includes(model)) {
          args.where = args.where || {};
          args.where.organizationId = orgId;
        }
        return query(args);
      },
    },
  });
}

// Usage
const orgPrisma = getPrismaForOrganization(user.organizationId);
const workflows = await orgPrisma.workflow.findMany(); // Automatically filtered
```

**Rationale:**
- Prevent cross-tenant data access
- Automatic filtering (no manual WHERE clause)
- Defense in depth

---

## 7. Migration Strategy

### 7.1 Dev/Stage/Prod Environments

```bash
# Development
npx prisma migrate dev --name add_workflow_templates

# Staging
npx prisma migrate deploy

# Production
npx prisma migrate deploy
```

---

### 7.2 Seeding Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Create official templates
  await prisma.template.createMany({
    data: [
      {
        name: 'Draft Email Response',
        description: 'Automatically draft responses to emails using AI',
        category: 'CUSTOMER_SUPPORT',
        difficulty: 'BEGINNER',
        estimatedTimeSavings: '2 hours/week',
        definition: { /* workflow DSL */ },
        requiredIntegrations: ['GMAIL', 'OPENAI'],
      },
      // ... more templates
    ],
  });

  // 2. Create demo organization
  await prisma.organization.create({
    data: {
      name: 'Demo Organization',
      plan: 'STARTER',
      users: {
        create: {
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'OWNER',
          passwordHash: await hash('demo123'),
        },
      },
    },
  });
}

main();
```

---

### 7.3 Migration Best Practices

1. **Backward Compatible:** Never break existing data
2. **Test on Staging:** Run migrations on staging first
3. **Rollback Plan:** Always have rollback script ready
4. **Zero Downtime:** Use online schema change (pg_osc) for large tables
5. **Backup First:** Backup database before migration

---

## 8. Performance Optimization

### 8.1 Query Optimization

**Avoid N+1 Queries:**

```typescript
// BAD (N+1 queries)
const workflows = await prisma.workflow.findMany();
for (const workflow of workflows) {
  const executions = await prisma.execution.findMany({
    where: { workflowId: workflow.id },
  });
  workflow.executions = executions;
}

// GOOD (1 query with include)
const workflows = await prisma.workflow.findMany({
  include: {
    executions: {
      take: 10, // Limit to prevent huge payloads
      orderBy: { startedAt: 'desc' },
    },
  },
});
```

**Pagination:**

```typescript
// Cursor-based pagination (better for infinite scroll)
const workflows = await prisma.workflow.findMany({
  take: 20,
  skip: 1, // Skip cursor
  cursor: { id: lastWorkflowId },
  orderBy: { createdAt: 'desc' },
});

// Offset-based pagination (simpler, but slower)
const workflows = await prisma.workflow.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' },
});
```

---

### 8.2 Connection Pooling

**Prisma Configuration:**

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Connection pool settings
  directUrl   = env("DIRECT_URL") // For migrations
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL") // For dev
}
```

**Environment Variables:**

```bash
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://user:pass@host:5432/db?connection_limit=1" // For migrations
```

**Rationale:**
- PgBouncer for connection pooling
- Limit connections to prevent database overload
- Separate connection for migrations (direct connection)

---

### 8.3 Read Replicas (Year 2+)

**Configuration:**

```typescript
// prisma/schema.prisma
datasource db {
  provider     = "postgresql"
  url          = env("DATABASE_URL")       // Primary (write)
  replication  = {
    url         = env("REPLICA_DATABASE_URL") // Read replica
  }
}
```

**Usage:**

```typescript
// Write to primary
await prisma.workflow.create({ data: { ... } });

// Read from replica (automatic)
const workflows = await prisma.workflow.findMany();
```

**Benefits:**
- Offload read queries to replica
- Faster reporting/analytics
- Reduce load on primary database

---

## 9. Monitoring & Maintenance

### 9.1 Database Health Checks

```typescript
// scripts/health-check.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseHealth() {
  try {
    // 1. Check connection
    await prisma.$queryRaw`SELECT 1`;

    // 2. Check table sizes
    const sizes = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;

    console.log('Table sizes:', sizes);

    // 3. Check slow queries
    const slowQueries = await prisma.$queryRaw`
      SELECT
        query,
        calls,
        total_time,
        mean_time
      FROM pg_stat_statements
      ORDER BY mean_time DESC
      LIMIT 10
    `;

    console.log('Slow queries:', slowQueries);

  } catch (error) {
    console.error('Health check failed:', error);
  }
}
```

---

### 9.2 Database Backup Strategy

**Automated Backups (Supabase):**
- Continuous backups (point-in-time recovery)
- 30-day retention
- Automated testing of backup restores

**Manual Backups (CLI):**

```bash
# Dump database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup_20260108.sql
```

**Disaster Recovery Plan:**
1. RTO (Recovery Time Objective): 1 hour
2. RPO (Recovery Point Objective): 5 minutes
3. Monthly restore tests
4. Off-site backups (different region)

---

## 10. Summary

### Schema Summary

**Core Entities:**
- **User & Organization:** Multi-tenant authentication
- **Workflow & Execution:** Core product (definitions and runs)
- **Integration:** External service connections
- **Template:** Prebuilt workflow library
- **Usage & Billing:** Track consumption and subscriptions

**Key Design Decisions:**
1. **Multi-tenant:** Organization-based isolation
2. **JSONB:** Flexible workflow definitions without schema migrations
3. **Encrypted credentials:** OAuth tokens/API keys encrypted at rest
4. **Time-series partitioning:** For Execution and ExecutionLog (Year 2)
5. **Data retention:** Automated cleanup of old records
6. **Strategic indexes:** Optimize common query patterns

### Next Steps

**Immediate:**
1. Initialize Prisma with PostgreSQL
2. Run initial migration (`npx prisma migrate dev`)
3. Seed database with templates
4. Test queries and indexes

**Short-term:**
1. Build CRUD API for workflows
2. Implement authentication (NextAuth.js)
3. Create database health checks
4. Setup backup strategy

**Long-term:**
1. Monitor query performance
2. Add partitions for large tables (Year 2)
3. Implement read replicas (Year 2)
4. Optimize indexes based on actual usage

---

**Document Status:** ✅ Complete
**Next Document:** API Specification (docs/technical/api-spec.md)
**Last Updated:** January 8, 2026
