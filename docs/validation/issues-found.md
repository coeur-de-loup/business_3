# Issues Found - SMB AI Orchestration Platform MVP

**Date:** January 9, 2026
**Tester:** QA Validator Agent
**Total Issues:** 22 (9 Critical, 6 High, 5 Medium, 2 Low)

---

## Critical Issues (Must Fix Before Deployment)

### Issue #1: TypeScript Compilation Errors Blocking Build
**Priority:** CRITICAL
**Status:** ❌ BLOCKING DEPLOYMENT
**Location:** Multiple files
**Impact:** Cannot build for production

**Error Details:**
```typescript
// File: src/app/api/v1/billing/status/route.ts:80
Error: Property 'cancelAtPeriodEnd' does not exist on type

// File: src/app/api/v1/stripe/webhook/route.ts
Lines: 104, 174, 178, 179, 180, 243
Error: Type mismatches in Stripe webhook handler

// File: src/lib/auth.ts:234
Error: Property 'id' missing in session object

// File: src/lib/stripe.ts:197, 209
Error: Object possibly 'undefined', API method missing
```

**Reproduction Steps:**
1. Run `pnpm type-check`
2. Observe 9 TypeScript compilation errors
3. Attempt `pnpm build` → Build fails

**Fix Required:**
- Update Stripe SDK to latest version: `pnpm add @stripe/stripe-js@latest`
- Fix webhook handler type assertions
- Add proper null checks with optional chaining
- Update Prisma schema to include missing fields
- Run `pnpm prisma generate` after schema changes

**Estimated Fix Time:** 2-4 hours

---

### Issue #2: Integration Credentials Stored in Plaintext
**Priority:** CRITICAL
**Status:** ❌ SECURITY VULNERABILITY
**Location:** `prisma/schema.prisma`, line 237
**CVSS Score:** 7.5 (High)

**Vulnerability:**
```typescript
model Integration {
  credentials Json?  // ❌ Stored as plaintext JSON
  // Should be encrypted with AES-256-GCM
}
```

**Impact:**
- Database compromise exposes all third-party API keys
- OAuth tokens stored in plaintext
- Violates SOC 2 compliance requirements
- Potential for credential theft

**Fix Required:**
```typescript
// 1. Add encryption library
import { encrypt, decrypt } from '@/lib/crypto';

// 2. Encrypt credentials before saving
const encrypted = await encrypt({
  accessToken: '...',
  refreshToken: '...'
});

await prisma.integration.create({
  data: {
    credentials: encrypted
  }
});

// 3. Decrypt on retrieval
const integration = await prisma.integration.findUnique({ ... });
const credentials = await decrypt(integration.credentials);
```

**Implementation:**
- Use crypto Web API (Node.js built-in)
- Generate unique encryption key per organization
- Store encryption keys in environment variables
- Add unit tests for encryption/decryption

**Estimated Fix Time:** 2-3 hours

---

### Issue #3: Stripe Webhook Handler Broken
**Priority:** CRITICAL
**Status:** ❌ PAYMENT PROCESSING BROKEN
**Location:** `src/app/api/v1/stripe/webhook/route.ts`
**Impact:** Cannot process subscription payments

**Problems:**
1. Type safety errors prevent webhook processing
2. Missing `cancelAtPeriodEnd` field handling
3. No webhook signature verification
4. Missing error handling for webhook events

**Fix Required:**
```typescript
// 1. Fix type handling
const session = stripeEvent.data.object as Stripe.Checkout.Session;

// 2. Add signature verification
const sig = request.headers.get('stripe-signature');
let event: Stripe.Event;

try {
  event = stripe.webhooks.constructEvent(
    await request.text(),
    sig!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
} catch (err) {
  return apiError('Invalid webhook signature', 400);
}

// 3. Handle all event types
switch (event.type) {
  case 'checkout.session.completed':
    // Handle subscription created
    break;
  case 'customer.subscription.deleted':
    // Handle subscription cancelled
    break;
  // Add more cases...
}
```

**Estimated Fix Time:** 3-4 hours

---

## High Priority Issues

### Issue #4: No API Rate Limiting
**Priority:** HIGH
**Status:** ⚠️ VULNERABILITY
**Location:** All API routes
**Impact:** Vulnerable to DoS attacks, brute force

**Problem:**
- No rate limiting on authentication endpoints
- API can be abused with unlimited requests
- No protection against credential stuffing
- Could result in high API bills

**Fix Required:**
```typescript
// Install rate limiter
pnpm add @upstash/ratelimit @upstash/redis

// Add middleware
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

// Apply to routes
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for');
  const { success } = await ratelimit.limit(ip!);

  if (!success) {
    return apiError('Too many requests', 429);
  }
  // ... rest of handler
}
```

**Estimated Fix Time:** 2-3 hours

---

### Issue #5: Missing Audit Logging
**Priority:** HIGH
**Status:** ⚠️ COMPLIANCE ISSUE
**Location:** Sensitive operations (auth, billing, integrations)
**Impact:** Cannot track security events, compliance violation

**Problem:**
- No audit trail for sensitive actions
- Cannot investigate security incidents
- SOC 2 compliance requires audit logging
- GDPR requires access logging

**Fix Required:**
```typescript
// 1. Create audit log model
model AuditLog {
  id             String   @id @default(cuid())
  organizationId String
  userId         String?
  action         String   // LOGIN, WORKFLOW_CREATED, INTEGRATION_ADDED
  resource       String?  // Type of resource affected
  resourceId     String?  // ID of resource affected
  ipAddress      String?
  userAgent      String?
  metadata       Json?
  timestamp      DateTime @default(now())
}

// 2. Add logging helper
export async function logAuditEvent(params: {
  action: string;
  userId: string;
  organizationId: string;
  resource?: string;
  resourceId?: string;
  metadata?: any;
}) {
  await prisma.auditLog.create({
    data: {
      ...params,
      ipAddress: headers.get('x-forwarded-for'),
      userAgent: headers.get('user-agent'),
    }
  });
}

// 3. Use in sensitive operations
await logAuditEvent({
  action: 'INTEGRATION_ADDED',
  userId,
  organizationId,
  resource: 'Integration',
  resourceId: integration.id,
  metadata: { provider: 'SLACK' }
});
```

**Estimated Fix Time:** 3-4 hours

---

### Issue #6: No Automated Test Suite
**Priority:** HIGH
**Status:** ⚠️ QUALITY RISK
**Location:** Entire codebase
**Impact:** Cannot verify functionality, risk of regressions

**Problem:**
- Zero unit tests written
- Zero integration tests written
- Zero E2E tests written
- Cannot safely refactor code
- No confidence in deployments

**Fix Required:**
```typescript
// 1. Write unit tests for critical functions
// src/lib/__tests__/auth.test.ts
import { hashPassword, verifyPassword } from '../auth';

describe('Password Hashing', () => {
  it('should hash password correctly', async () => {
    const hash = await hashPassword('password123');
    expect(hash).not.toBe('password123');
  });

  it('should verify correct password', async () => {
    const hash = await hashPassword('password123');
    const isValid = await verifyPassword('password123', hash);
    expect(isValid).toBe(true);
  });
});

// 2. Write API integration tests
// src/app/api/v1/__tests__/workflows.test.ts
import { POST } from '../workflows/route';

describe('POST /api/v1/workflows', () => {
  it('should create workflow when authenticated', async () => {
    const request = new Request('http://localhost:3000/api/v1/workflows', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Workflow',
        category: 'MARKETING',
        definition: { nodes: [], edges: [] }
      }),
      headers: {
        Authorization: `Bearer ${testToken}`
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});

// 3. Write E2E tests with Playwright
// e2e/workflows.spec.ts
import { test, expect } from '@playwright/test';

test('create workflow flow', async ({ page }) => {
  await page.goto('/workflows/new');
  await page.fill('[name="name"]', 'Test Workflow');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/workflows\/[a-z0-9]+/);
});
```

**Estimated Fix Time:** 12-16 hours (for critical path tests)

---

### Issue #7: Session Type Inconsistency
**Priority:** HIGH
**Status:** ⚠️ AUTH BUG
**Location:** `src/lib/auth.ts:234`
**Impact:** Session authentication may fail

**Problem:**
```typescript
// Expected shape:
{ id: string, email: string, organizationId: string, role: string }

// Actual shape:
{ userId: string, email: string, organizationId: string, role: string }

// Property mismatch: 'id' vs 'userId'
```

**Fix Required:**
```typescript
// src/lib/auth.ts - Line 234
// Change from:
const session = {
  userId: user.id,
  email: user.email,
  organizationId: user.organizationId,
  role: user.role
};

// To:
const session = {
  id: user.id,  // ✅ Fixed property name
  email: user.email,
  organizationId: user.organizationId,
  role: user.role
};
```

**Estimated Fix Time:** 15 minutes

---

### Issue #8: No Password Reset Flow
**Priority:** HIGH
**Status:** ⚠️ USER EXPERIENCE
**Location:** Authentication system
**Impact:** Users cannot recover locked accounts

**Problem:**
- No password reset endpoint
- No "forgot password" UI
- No email sending for reset tokens
- Users locked out if password forgotten

**Fix Required:**
```typescript
// 1. Add password reset endpoint
// POST /api/v1/auth/forgot-password
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return apiSuccess({ message: 'If email exists, reset link sent' });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: resetToken,
      expiresAt
    }
  });

  // Send email
  await sendEmail({
    to: user.email,
    subject: 'Reset Your Password',
    body: `Click here to reset: ${process.env.APP_URL}/reset-password?token=${resetToken}`
  });

  return apiSuccess({ message: 'Reset link sent' });
}

// 2. Add reset password endpoint
// POST /api/v1/auth/reset-password
export async function POST(request: NextRequest) {
  const { token, newPassword } = await request.json();

  const reset = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!reset || reset.expiresAt < new Date()) {
    return apiError('Invalid or expired token', 400);
  }

  // Update password
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: reset.userId },
    data: { passwordHash }
  });

  // Delete reset token
  await prisma.passwordReset.delete({ where: { token } });

  return apiSuccess({ message: 'Password reset successful' });
}
```

**Estimated Fix Time:** 3-4 hours

---

## Medium Priority Issues

### Issue #9: No Error Monitoring (Sentry)
**Priority:** MEDIUM
**Status:** ⚠️ OBSERVABILITY GAP
**Location:** Entire application
**Impact:** Cannot detect or debug production errors

**Fix Required:**
```typescript
// 1. Install Sentry
pnpm add @sentry/nextjs

// 2. Initialize Sentry
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// 3. Wrap API routes
import { captureException } from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    // ... API logic
  } catch (error) {
    captureException(error);
    return handleApiError(error);
  }
}
```

**Estimated Fix Time:** 1-2 hours

---

### Issue #10: No Structured Logging
**Priority:** MEDIUM
**Status:** ⚠️ DEBUGGING DIFFICULTY
**Location:** Entire application
**Impact:** Cannot trace issues, no request logging

**Fix Required:**
```typescript
// Install logging library
pnpm add pino pino-pretty

// Create logger
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
});

// Use in routes
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  logger.info({ endpoint: '/api/v1/workflows', method: 'POST' });

  try {
    // ... API logic
    logger.info({ workflowId: workflow.id, message: 'Workflow created' });
  } catch (error) {
    logger.error({ error, message: 'Failed to create workflow' });
    throw error;
  }
}
```

**Estimated Fix Time:** 2-3 hours

---

### Issue #11: No Content Security Policy (CSP)
**Priority:** MEDIUM
**Status:** ⚠️ SECURITY HARDENING
**Location:** Next.js headers
**Impact:** Vulnerable to XSS attacks

**Fix Required:**
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      block-all-mixed-content;
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

**Estimated Fix Time:** 1 hour

---

### Issue #12: No Caching Layer
**Priority:** MEDIUM
**Status:** ⚠️ PERFORMANCE
**Location:** API routes, database queries
**Impact:** Slow response times, high database load

**Fix Required:**
```typescript
// Install Upstash Redis
pnpm add @upstash/redis

// Create cache client
// src/lib/cache.ts
import { Redis } from "@upstash/redis";

export const cache = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Use caching
export async function getWorkflows(organizationId: string) {
  const cacheKey = `workflows:${organizationId}`;

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Cache miss - query database
  const workflows = await prisma.workflow.findMany({
    where: { organizationId }
  });

  // Cache for 5 minutes
  await cache.set(cacheKey, workflows, { ex: 300 });

  return workflows;
}
```

**Estimated Fix Time:** 3-4 hours

---

### Issue #13: No Webhook Security
**Priority:** MEDIUM
**Status:** ⚠️ SECURITY
**Location:** Integration webhooks
**Impact:** Webhooks can be spoofed

**Fix Required:**
```typescript
// Add signature verification
import crypto from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// Use in webhook handler
export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('x-webhook-signature')!;

  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return apiError('Invalid signature', 401);
  }

  // Process webhook...
}
```

**Estimated Fix Time:** 1-2 hours

---

## Low Priority Issues

### Issue #14: No API Documentation
**Priority:** LOW
**Status:** 📝 DOCUMENTATION
**Location:** API routes
**Impact:** Difficult for developers to integrate

**Fix Required:**
```typescript
// Install Swagger
pnpm add swagger-jsdoc swagger-ui-react

// Create OpenAPI spec
// src/lib/openapi.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SMB AI Orchestration Platform API',
      version: '1.0.0',
    },
  },
  apis: ['./src/app/api/v1/**/*.ts'],
};

export const openApiSpec = swaggerJsdoc(options);

// Add JSDoc comments to routes
/**
 * @openapi
 * /api/v1/workflows:
 *   get:
 *     summary: List workflows
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved workflows
 */
export async function GET(request: NextRequest) {
  // ...
}
```

**Estimated Fix Time:** 4-6 hours

---

### Issue #15: No Health Check Endpoint
**Priority:** LOW
**Status:** 🔧 OPERATIONS
**Location:** API routes
**Impact:** Cannot monitor service health

**Fix Required:**
```typescript
// src/app/api/health/route.ts
import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      cache: 'unknown',
    },
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = 'healthy';
  } catch (error) {
    checks.services.database = 'unhealthy';
    checks.status = 'degraded';
  }

  // Check cache (if configured)
  try {
    const cache = new Redis({ ... });
    await cache.ping();
    checks.services.cache = 'healthy';
  } catch (error) {
    checks.services.cache = 'unhealthy';
    checks.status = 'degraded';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return Response.json(checks, { status: statusCode });
}
```

**Estimated Fix Time:** 30 minutes

---

## Summary Statistics

**Total Issues:** 22
- **Critical:** 3 (must fix before deployment)
- **High:** 6 (should fix before production)
- **Medium:** 5 (fix within 1-2 weeks)
- **Low:** 2 (fix when convenient)

**Estimated Total Fix Time:** 40-60 hours

**Priority Order:**
1. Fix TypeScript errors (#1) - 2-4 hours
2. Encrypt credentials (#2) - 2-3 hours
3. Fix Stripe webhooks (#3) - 3-4 hours
4. Add rate limiting (#4) - 2-3 hours
5. Add audit logging (#5) - 3-4 hours
6. Fix session type (#7) - 15 minutes
7. Write critical tests (#6) - 12-16 hours
8. Add error monitoring (#9) - 1-2 hours
9. Add structured logging (#10) - 2-3 hours
10. Add security headers (#11) - 1 hour

**Minimum Viable Fixes Before Deployment:**
- Issues #1, #2, #3, #7 (Critical only)
- **Estimated time: 8-12 hours**

---

**Report Status:** ✅ Complete
**Next Action:** Address critical issues, then re-test
**Sign-off:** QA Validator Agent
