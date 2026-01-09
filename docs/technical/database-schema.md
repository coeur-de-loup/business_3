# Database Schema Documentation

**Date:** January 9, 2026
**Status:** Complete - Ready for Migration
**Based On:** Technical Architecture (docs/technical/architecture.md)

---

## Overview

This database schema supports a multi-tenant B2B SaaS application for client portals. It is designed for:
- **Multi-tenancy**: Each agency has isolated data
- **Scalability**: Handles thousands of agencies, portals, and messages
- **Security**: Role-based access control and data isolation
- **Flexibility**: Supports future features and integrations

**Database Technology**: PostgreSQL (hosted on Neon)
**ORM**: Prisma
**Schema Location**: `prisma/schema.prisma`

---

## Core Entities & Relationships

```
Agencies (1) ─────────────────────────── (N) Users
    │                                          │
    │ (1)                                      │ (N)
    │                                          │
    │ (N)                                      │
    ├──────────────────┐                       │
    │                  │                       │
(N) Portals        (1) Subscription           │
    │                                          │
    │ (1)                                      │
    │                  │                       │
(N) Projects        (N) Messages              │
    │                  │                       │
    │ (N)              │                       │
Milestones          │                       │
                    │                       │
               (N) Files ───────────────────┘
```

---

## Entity Details

### 1. Agency

**Purpose**: Represents a customer agency (our paying customer)

**Key Fields**:
- `id`: Unique identifier
- `name`: Agency name (e.g., "Acme Marketing Agency")
- `slug`: Custom subdomain slug (future: `acme.clientportal.com`)
- `logoUrl`: Agency logo
- `domain`: Custom domain (future white-label feature)
- `planId`: Subscription tier (`starter`, `professional`, `agency`)
- `stripeCustomerId`: Stripe billing customer ID

**Relationships**:
- Has many `User` (agency owner + team members)
- Has many `Portal` (client portals)
- Has one `Subscription` (billing info)
- Has many `UsageRecord` (plan limit tracking)

**Indexes**:
- `stripeCustomerId` (for Stripe webhook lookups)

---

### 2. User

**Purpose**: Agency owner and team members (authenticated users)

**Key Fields**:
- `id`: Unique identifier
- `email`: Email address (unique, used for login)
- `passwordHash`: Bcrypt hash of password
- `name`: Display name
- `role`: `OWNER`, `ADMIN`, or `MEMBER`
- `agencyId`: Belongs to one agency

**Role Permissions**:

| Role | Permissions |
|------|-------------|
| **OWNER** | Full access: billing, team management, all portals |
| **ADMIN** | Full access to portals, messages, files; no billing access |
| **MEMBER** | Access to assigned portals only; cannot delete |

**Relationships**:
- Belongs to one `Agency`
- Sends many `Message`
- Uploads many `File`

**Indexes**:
- `agencyId` (for agency-scoped queries)
- `email` (for login lookups)

**Security**:
- Passwords hashed with bcrypt (cost factor 12)
- Every query scoped to `agencyId` (multi-tenant isolation)

---

### 3. Portal

**Purpose**: A client portal (shared workspace for one agency-client relationship)

**Key Fields**:
- `id`: Unique identifier
- `agencyId`: Belongs to one agency
- `clientName`: Client's name (e.g., "John Doe")
- `clientEmail`: Client's email
- `title`: Portal title (e.g., "Website Redesign Project")
- `description`: Optional description
- `status`: `ACTIVE`, `ARCHIVED`, `ON_HOLD`
- `theme`: Visual theme (`light`, `dark`)
- `primaryColor`: Custom brand color (hex)
- `logoUrl`: Agency's logo for this portal
- `magicToken`: Cryptographically random token for client access
- `magicTokenExpiresAt`: Token expiration date

**White-Label Branding**:
- Each portal can have custom colors and logo
- Clients see agency's brand, not "Client Portal SaaS" branding
- Theme customization per portal

**Magic Link Authentication**:
- Clients access portal via token-based link (no password)
- Token format: `portalId_token_randomString`
- Tokens stored in database (can be revoked)
- Tokens expire after 30 days (configurable)

**Relationships**:
- Belongs to one `Agency`
- Has many `Message`
- Has many `File`
- Has many `Project`

**Indexes**:
- `agencyId` (for agency dashboards)
- `magicToken` (for client access lookups)

---

### 4. Message

**Purpose**: Messages exchanged between agency and client

**Key Fields**:
- `id`: Unique identifier
- `portalId`: Belongs to one portal
- `senderId`: User ID (if sent by agency member)
- `senderType`: `USER` (agency) or `CLIENT` (external)
- `senderName`: Display name for client messages
- `senderEmail`: Email for client messages
- `content`: Message text (supports markdown)
- `readAt`: Timestamp when agency user read the message

**Sender Types**:
- **USER**: Agency owner or team member (has `senderId`)
- **CLIENT**: External client (no `senderId`, uses `senderName`/`senderEmail`)

**Relationships**:
- Belongs to one `Portal`
- Optionally sent by one `User` (if agency member)

**Indexes**:
- `portalId` (for portal message lists)
- `senderId` (for user message history)

**Read Tracking**:
- `readAt` is null for unread messages
- Agency users can mark messages as read
- Client messages don't need read tracking (clients don't login)

---

### 5. File

**Purpose**: Files uploaded to portals (PDFs, images, documents, etc.)

**Key Fields**:
- `id`: Unique identifier
- `portalId`: Belongs to one portal
- `uploadedById`: User who uploaded the file
- `filename`: Original filename (e.g., "proposal-v2.pdf")
- `s3Key`: S3/R2 path (e.g., `{agencyId}/{portalId}/{fileId}/proposal-v2.pdf`)
- `size`: File size in bytes
- `mimeType`: MIME type (e.g., "application/pdf")
- `version`: Version number (starts at 1)
- `isLatest`: Boolean flag for latest version
- `parentFileId`: Links to previous version (if updating)

**File Storage**:
- Files stored in Cloudflare R2 (S3-compatible)
- S3 key format: `{agencyId}/{portalId}/{fileId}/{filename}`
- Presigned URLs for secure downloads
- Direct S3 access (files don't pass through our servers)

**Version Control**:
- When updating a file, create new `File` record
- Link new version to original via `parentFileId`
- Only latest version has `isLatest = true`
- Users can download previous versions

**Relationships**:
- Belongs to one `Portal`
- Uploaded by one `User` (agency member)

**Indexes**:
- `portalId` (for portal file lists)
- `uploadedById` (for user upload history)
- `s3Key` (for S3 lookups, unique)

---

### 6. Project

**Purpose**: Optional project organization within portals

**Key Fields**:
- `id`: Unique identifier
- `portalId`: Belongs to one portal
- `name`: Project name
- `description`: Optional description
- `status`: `PLANNING`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `CANCELLED`
- `startDate`: Project start date
- `endDate`: Project end date

**Relationships**:
- Belongs to one `Portal`
- Has many `Milestone`

**Indexes**:
- `portalId` (for portal project lists)

**Use Case**:
- Not all portals need projects (optional feature)
- Projects help organize work within a portal
- Milestones track project progress

---

### 7. Milestone

**Purpose**: Project milestones and deliverables

**Key Fields**:
- `id`: Unique identifier
- `projectId`: Belongs to one project
- `title`: Milestone title (e.g., "Design Approval")
- `description`: Optional description
- `status`: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- `dueDate`: Target completion date
- `completedAt`: Actual completion date
- `order`: Display order (for UI sorting)

**Relationships**:
- Belongs to one `Project`

**Indexes**:
- `projectId` (for project milestone lists)

**Use Case**:
- Track deliverables within projects
- Show clients progress timeline
- Agency can mark milestones as complete

---

### 8. Subscription

**Purpose**: Agency subscription and billing information

**Key Fields**:
- `id`: Unique identifier
- `agencyId`: One-to-one with Agency
- `stripeSubscriptionId`: Stripe subscription ID
- `stripePriceId`: Stripe price ID (e.g., `price_starter_monthly`)
- `status`: `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELLED`, `INCOMPLETE`
- `currentPeriodStart`: Current billing period start
- `currentPeriodEnd`: Current billing period end
- `cancelAtPeriodEnd`: Boolean flag for cancellation
- `trialEndsAt`: Trial expiration date

**Relationships**:
- Belongs to one `Agency` (one-to-one)

**Indexes**:
- `stripeSubscriptionId` (for Stripe webhook lookups)

**Subscription Flow**:
1. Agency signs up → Create `Subscription` with status `TRIALING`
2. Trial ends (14 days) → Agency must subscribe or cancel
3. Stripe webhook updates `Subscription` status
4. Agency can cancel → `cancelAtPeriodEnd = true`

---

### 9. UsageRecord

**Purpose**: Track usage against plan limits

**Key Fields**:
- `id`: Unique identifier
- `agencyId`: Belongs to one agency
- `metric`: Metric name (e.g., `activePortals`, `teamMembers`, `storageGB`)
- `count`: Current count
- `month`: Month (1-12)
- `year`: Year (e.g., 2026)

**Relationships**:
- Belongs to one `Agency`

**Unique Constraint**:
- `agencyId + metric + month + year` (one record per metric per month)

**Use Cases**:
- Track active portals (against plan limits: 3 for Starter, 25 for Pro, unlimited for Agency)
- Track team members (against plan limits)
- Track storage usage (against plan limits: 5GB, 50GB, unlimited)

**Example Records**:
```
agencyId: abc123
metric: "activePortals"
count: 5
month: 1
year: 2026
```

---

## Plan Limits

Based on business model (docs/strategy/business-model.md):

| Plan | Active Portals | Team Members | Storage |
|------|---------------|--------------|---------|
| **Starter** ($29/mo) | 3 | 1 (owner only) | 5GB |
| **Professional** ($79/mo) | 25 | 5 | 50GB |
| **Agency** ($149/mo) | Unlimited | Unlimited | Unlimited |

**Enforcement**:
- Before creating portal: Check `UsageRecord` for `activePortals`
- Before inviting team member: Check `UsageRecord` for `teamMembers`
- Before uploading file: Check `UsageRecord` for `storageGB`

---

## Multi-Tenant Data Isolation

**Critical Security Feature**: Every query is scoped to `agencyId`

**Examples**:
```typescript
// WRONG: Returns all portals (security vulnerability)
const portals = await prisma.portal.findMany()

// RIGHT: Returns only this agency's portals
const portals = await prisma.portal.findMany({
  where: { agencyId: currentAgencyId }
})
```

**Implementation**:
- All API routes validate user session and get `agencyId`
- All database queries filter by `agencyId`
- No cross-agency data access possible

---

## Database Migrations

**Current Status**: Schema defined, not yet migrated

**Next Steps**:
1. Set up Neon database (free tier)
2. Add `DATABASE_URL` to `.env`
3. Run migration: `npx prisma migrate dev --name init`
4. Generate Prisma client: `npx prisma generate`
5. (Optional) Seed database with test data

**Migration Files**:
- Migrations stored in `prisma/migrations/`
- Each migration is timestamped and named
- Can rollback if needed: `npx prisma migrate resolve`

---

## Seed Data (Development)

**Location**: `prisma/seed.ts` (to be created)

**Seed Data Includes**:
- 1 test agency
- 1 test user (agency owner)
- 3 test portals
- Sample messages, files, projects, milestones

**Run Seed**:
```bash
npx prisma db seed
```

---

## Performance Considerations

**Indexes Added For**:
- Foreign keys (`agencyId`, `portalId`, `userId`, etc.)
- Unique lookups (`email`, `stripeCustomerId`, `magicToken`, `s3Key`)
- Common queries (portal lists, message lists, file lists)

**Future Optimizations** (if needed):
- Add composite indexes for complex queries
- Use connection pooling (Neon handles automatically)
- Add read replicas for heavy read workloads
- Cache frequently-accessed data (Redis)

---

## Security Considerations

**Data Isolation**:
- All queries scoped to `agencyId`
- No cross-agency data access
- Users can only access their agency's data

**Authentication**:
- Passwords hashed with bcrypt (cost factor 12)
- Session tokens stored in HTTP-only cookies
- Magic tokens are cryptographically random (256 bits)

**Authorization**:
- Role-based access control (OWNER, ADMIN, MEMBER)
- Clients can only access their specific portal
- Team members limited to assigned portals (future feature)

**Input Validation**:
- All API inputs validated with Zod schemas
- SQL injection prevented (Prisma parameterized queries)
- XSS prevented (React escapes by default)

**File Security**:
- Files stored in private S3 bucket (no public access)
- Presigned URLs expire after 1 hour
- File type validation (allow-list, not block-list)
- File size limits (configurable per plan)

---

## Next Steps

1. ✅ Complete database schema (this document)
2. ⬜ Set up Neon database account
3. ⬜ Add `DATABASE_URL` to environment variables
4. ⬜ Run initial migration
5. ⬜ Create seed data file
6. ⬜ Test database with sample queries
7. ⬜ Implement Prisma middleware for automatic `agencyId` scoping
8. ⬜ Set up NextAuth for authentication
9. ⬜ Build API routes for CRUD operations

---

**Document Status**: ✅ Complete
**Next Task**: Set up Neon database and run migration
**Last Updated**: January 9, 2026
