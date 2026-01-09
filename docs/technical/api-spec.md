# API Specification: SMB AI Orchestration Platform

**Date:** January 8, 2026
**Status:** Draft - MVP API
**Version:** 1.0
**Architect:** Code Architect Agent

---

## Executive Summary

This document defines the RESTful API specification for the SMB AI Orchestration Platform, covering all endpoints for authentication, workflows, integrations, templates, and more.

**Design Principles:**
- **RESTful:** Resource-oriented URLs, HTTP verbs, status codes
- **JSON:** All requests/responses use JSON (except file uploads)
- **Versioned:** `/api/v1/` prefix for future compatibility
- **Secure:** JWT authentication, rate limiting, input validation
- **Idempotent:** Safe retries for POST/PUT/PATCH operations

**Base URL:**
- **Production:** `https://api.ai-orchestration-platform.com/api/v1`
- **Staging:** `https://staging-api.ai-orchestration-platform.com/api/v1`
- **Development:** `http://localhost:3000/api/v1`

---

## 1. Authentication & Authorization

### 1.1 Authentication Strategy

**JWT-Based Authentication:**
- Access tokens (JWT) stored in httpOnly cookies
- Token expiry: 15 minutes (refresh token rotation)
- Refresh tokens: 7 days (rotated on each refresh)

**Authentication Flow:**

```
┌─────────┐                              ┌──────────────┐
│  User   │                              │   Database   │
└────┬────┘                              └──────┬───────┘
     │                                         │
     │ 1. POST /auth/login                    │
     │    { email, password }                 │
     ├─────────────────────────────────────▶  │
     │                                         │
     │ 2. Validate Credentials                │
     │                                         │
     │◀─────────────────────────────────────  │
     │    { accessToken, refreshToken }        │
     │    (Set httpOnly cookies)              │
     │                                         │
     │ 3. Subsequent Requests                 │
     │    GET /workflows                       │
     │    Cookie: accessToken=xxx             │
     ├─────────────────────────────────────▶  │
     │                                         │
     │◀─────────────────────────────────────  │
     │    { workflows: [...] }                 │
     │                                         │
     ▼                                         ▼
```

---

### 1.2 Auth Endpoints

#### POST /auth/register

Register a new user and organization.

**Request:**

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "organizationName": "Acme Corp"
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": "user_123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "OWNER",
    "organizationId": "org_456def"
  },
  "organization": {
    "id": "org_456def",
    "name": "Acme Corp",
    "plan": "STARTER",
    "trialEndsAt": "2026-02-08T00:00:00Z"
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid email, weak password
- **409 Conflict:** Email already exists

---

#### POST /auth/login

Authenticate user and receive tokens.

**Request:**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "user_123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "OWNER"
  },
  "organization": {
    "id": "org_456def",
    "name": "Acme Corp",
    "plan": "STARTER"
  }
}
```

**Cookies Set:**
- `accessToken`: JWT (httpOnly, secure, 15-minute expiry)
- `refreshToken`: JWT (httpOnly, secure, 7-day expiry)

**Error Responses:**

- **401 Unauthorized:** Invalid credentials
- **429 Too Many Requests:** Rate limit exceeded

---

#### POST /auth/logout

Invalidate tokens and clear cookies.

**Request:**

```http
POST /api/v1/auth/logout
Cookie: accessToken=xxx; refreshToken=xxx
```

**Response (204 No Content):**

```
(no content)
```

**Cookies Cleared:**
- `accessToken`: Expired
- `refreshToken`: Expired

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Request:**

```http
POST /api/v1/auth/refresh
Cookie: refreshToken=xxx
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGc..."
}
```

**Cookies Set:**
- `accessToken`: New JWT (15-minute expiry)
- `refreshToken`: New JWT (7-day expiry, rotated)

**Error Responses:**

- **401 Unauthorized:** Invalid refresh token
- **429 Too Many Requests:** Rate limit exceeded

---

#### GET /auth/me

Get current user profile.

**Request:**

```http
GET /api/v1/auth/me
Authorization: Bearer xxx
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "user_123abc",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "OWNER"
  },
  "organization": {
    "id": "org_456def",
    "name": "Acme Corp",
    "plan": "STARTER",
    "trialEndsAt": "2026-02-08T00:00:00Z"
  }
}
```

---

## 2. Workflows

### 2.1 Workflow Endpoints

#### GET /workflows

List all workflows for the current organization.

**Request:**

```http
GET /api/v1/workflows?status=ACTIVE&category=MARKETING&page=1&limit=20
Authorization: Bearer xxx
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status (ACTIVE, PAUSED, ARCHIVED, DRAFT) |
| category | string | No | Filter by category (MARKETING, SALES, etc.) |
| search | string | No | Search in name/description |
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20, max: 100) |
| sort | string | No | Sort field (createdAt, updatedAt, name) |
| order | string | No | Sort order (asc, desc) |

**Response (200 OK):**

```json
{
  "workflows": [
    {
      "id": "wf_789ghi",
      "name": "Email Marketing Campaign",
      "description": "Automate email campaigns with AI-generated content",
      "category": "MARKETING",
      "status": "ACTIVE",
      "schedule": null,
      "triggers": {
        "type": "MANUAL"
      },
      "createdAt": "2026-01-08T10:00:00Z",
      "updatedAt": "2026-01-08T10:00:00Z",
      "createdBy": {
        "id": "user_123abc",
        "name": "John Doe"
      },
      "executionCount": 42,
      "lastExecutionAt": "2026-01-08T09:30:00Z",
      "successRate": 95.2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

#### POST /workflows

Create a new workflow.

**Request:**

```http
POST /api/v1/workflows
Authorization: Bearer xxx
Content-Type: application/json

{
  "name": "Draft Email Response",
  "description": "Automatically draft responses to incoming emails",
  "category": "CUSTOMER_SUPPORT",
  "definition": {
    "steps": [
      {
        "id": "step_1",
        "type": "integration",
        "service": "gmail",
        "action": "read_email"
      },
      {
        "id": "step_2",
        "type": "llm",
        "model": "gpt-4",
        "prompt": "Draft a response to this email"
      }
    ]
  },
  "triggers": {
    "type": "WEBHOOK",
    "webhookUrl": "https://api.ai-orchestration-platform.com/webhooks/wf_789ghi"
  }
}
```

**Response (201 Created):**

```json
{
  "id": "wf_789ghi",
  "name": "Draft Email Response",
  "description": "Automatically draft responses to incoming emails",
  "category": "CUSTOMER_SUPPORT",
  "status": "ACTIVE",
  "definition": { /* ... */ },
  "triggers": { /* ... */ },
  "createdAt": "2026-01-08T10:00:00Z",
  "updatedAt": "2026-01-08T10:00:00Z",
  "createdBy": {
    "id": "user_123abc",
    "name": "John Doe"
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid workflow definition
- **402 Payment Required:** Workflow limit exceeded for plan
- **422 Unprocessable Entity:** Validation error

---

#### GET /workflows/:id

Get a specific workflow by ID.

**Request:**

```http
GET /api/v1/workflows/wf_789ghi
Authorization: Bearer xxx
```

**Response (200 OK):**

```json
{
  "id": "wf_789ghi",
  "name": "Draft Email Response",
  "description": "Automatically draft responses to incoming emails",
  "category": "CUSTOMER_SUPPORT",
  "status": "ACTIVE",
  "definition": { /* full workflow definition */ },
  "triggers": { /* triggers configuration */ },
  "createdAt": "2026-01-08T10:00:00Z",
  "updatedAt": "2026-01-08T10:00:00Z",
  "createdBy": {
    "id": "user_123abc",
    "name": "John Doe"
  },
  "executionCount": 42,
  "lastExecutionAt": "2026-01-08T09:30:00Z",
  "successRate": 95.2
}
```

**Error Responses:**

- **404 Not Found:** Workflow not found
- **403 Forbidden:** User doesn't have access

---

#### PUT /workflows/:id

Update a workflow.

**Request:**

```http
PUT /api/v1/workflows/wf_789ghi
Authorization: Bearer xxx
Content-Type: application/json

{
  "name": "Draft Email Response (Updated)",
  "definition": { /* updated definition */ },
  "status": "ACTIVE"
}
```

**Response (200 OK):**

```json
{
  "id": "wf_789ghi",
  "name": "Draft Email Response (Updated)",
  "definition": { /* ... */ },
  "status": "ACTIVE",
  "updatedAt": "2026-01-08T11:00:00Z"
}
```

**Error Responses:**

- **400 Bad Request:** Invalid workflow definition
- **403 Forbidden:** User doesn't have permission
- **404 Not Found:** Workflow not found

---

#### DELETE /workflows/:id

Delete a workflow (soft delete: sets status to ARCHIVED).

**Request:**

```http
DELETE /api/v1/workflows/wf_789ghi
Authorization: Bearer xxx
```

**Response (204 No Content):**

```
(no content)
```

---

#### POST /workflows/:id/execute

Manually trigger a workflow execution.

**Request:**

```http
POST /api/v1/workflows/wf_789ghi/execute
Authorization: Bearer xxx
Content-Type: application/json

{
  "input": {
    "emailId": "msg_12345",
    "customerName": "Jane Smith"
  }
}
```

**Response (202 Accepted):**

```json
{
  "executionId": "exec_xyz123",
  "status": "PENDING",
  "startedAt": "2026-01-08T10:00:00Z",
  "message": "Workflow execution queued"
}
```

**Error Responses:**

- **400 Bad Request:** Invalid input
- **403 Forbidden:** User doesn't have permission
- **404 Not Found:** Workflow not found
- **409 Conflict:** Workflow is paused or archived

---

#### GET /workflows/:id/executions

Get execution history for a workflow.

**Request:**

```http
GET /api/v1/workflows/wf_789ghi/executions?status=COMPLETED&page=1&limit=20
Authorization: Bearer xxx
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status (PENDING, RUNNING, COMPLETED, FAILED) |
| result | string | No | Filter by result (SUCCESS, PARTIAL, FAILURE) |
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20) |

**Response (200 OK):**

```json
{
  "executions": [
    {
      "id": "exec_xyz123",
      "status": "COMPLETED",
      "result": "SUCCESS",
      "startedAt": "2026-01-08T09:30:00Z",
      "completedAt": "2026-01-08T09:30:15Z",
      "duration": 15000,
      "triggeredBy": "MANUAL",
      "output": {
        "draftId": "draft_abc",
        "subject": "Re: Your inquiry"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

## 3. Executions

### 3.1 Execution Endpoints

#### GET /executions

List all executions (with filters).

**Request:**

```http
GET /api/v1/executions?status=RUNNING&workflowId=wf_789ghi&page=1&limit=20
Authorization: Bearer xxx
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| workflowId | string | No | Filter by workflow |
| status | string | No | Filter by status |
| result | string | No | Filter by result |
| startDate | string | No | Filter by start date (ISO 8601) |
| endDate | string | No | Filter by end date (ISO 8601) |
| page | integer | No | Page number |
| limit | integer | No | Items per page |

**Response (200 OK):**

```json
{
  "executions": [
    {
      "id": "exec_xyz123",
      "workflow": {
        "id": "wf_789ghi",
        "name": "Draft Email Response"
      },
      "status": "COMPLETED",
      "result": "SUCCESS",
      "startedAt": "2026-01-08T09:30:00Z",
      "completedAt": "2026-01-08T09:30:15Z",
      "duration": 15000,
      "triggeredBy": "MANUAL",
      "triggeredByUser": {
        "id": "user_123abc",
        "name": "John Doe"
      }
    }
  ],
  "pagination": { /* ... */ }
}
```

---

#### GET /executions/:id

Get execution details.

**Request:**

```http
GET /api/v1/executions/exec_xyz123
Authorization: Bearer xxx
```

**Response (200 OK):**

```json
{
  "id": "exec_xyz123",
  "workflow": {
    "id": "wf_789ghi",
    "name": "Draft Email Response"
  },
  "status": "COMPLETED",
  "result": "SUCCESS",
  "startedAt": "2026-01-08T09:30:00Z",
  "completedAt": "2026-01-08T09:30:15Z",
  "duration": 15000,
  "triggeredBy": "MANUAL",
  "input": {
    "emailId": "msg_12345",
    "customerName": "Jane Smith"
  },
  "output": {
    "draftId": "draft_abc",
    "subject": "Re: Your inquiry",
    "body": "Dear Jane, thank you for your inquiry..."
  },
  "steps": [
    {
      "id": "step_1",
      "name": "Read Email",
      "status": "COMPLETED",
      "duration": 500,
      "output": { /* step output */ }
    },
    {
      "id": "step_2",
      "name": "Generate Draft",
      "status": "COMPLETED",
      "duration": 14500,
      "output": { /* step output */ }
    }
  ]
}
```

---

#### GET /executions/:id/logs

Get execution logs.

**Request:**

```http
GET /api/v1/executions/exec_xyz123/logs?level=INFO
Authorization: Bearer xxx
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| level | string | No | Filter by level (DEBUG, INFO, WARN, ERROR) |
| stepId | string | No | Filter by step ID |

**Response (200 OK):**

```json
{
  "logs": [
    {
      "id": "log_abc123",
      "level": "INFO",
      "stepId": "step_1",
      "message": "Reading email from Gmail",
      "timestamp": "2026-01-08T09:30:00Z"
    },
    {
      "id": "log_def456",
      "level": "INFO",
      "stepId": "step_2",
      "message": "Calling OpenAI API",
      "timestamp": "2026-01-08T09:30:01Z"
    }
  ]
}
```

---

#### POST /executions/:id/cancel

Cancel a running execution.

**Request:**

```http
POST /api/v1/executions/exec_xyz123/cancel
Authorization: Bearer xxx
```

**Response (200 OK):**

```json
{
  "id": "exec_xyz123",
  "status": "CANCELLED",
  "message": "Execution cancelled successfully"
}
```

**Error Responses:**

- **400 Bad Request:** Execution cannot be cancelled (already completed)
- **404 Not Found:** Execution not found
- **403 Forbidden:** User doesn't have permission

---

## 4. Integrations

### 4.1 Integration Endpoints

#### GET /integrations

List all integrations for the organization.

**Request:**

```http
GET /api/v1/integrations?status=ACTIVE
Authorization: Bearer xxx
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| provider | string | No | Filter by provider (GMAIL, SLACK, etc.) |
| status | string | No | Filter by status (ACTIVE, EXPIRED, ERROR) |

**Response (200 OK):**

```json
{
  "integrations": [
    {
      "id": "int_123abc",
      "provider": "GMAIL",
      "status": "ACTIVE",
      "lastUsedAt": "2026-01-08T09:30:00Z",
      "settings": {
        "webhooksEnabled": true
      },
      "createdAt": "2026-01-01T10:00:00Z"
    },
    {
      "id": "int_456def",
      "provider": "SLACK",
      "status": "ACTIVE",
      "lastUsedAt": "2026-01-07T15:00:00Z",
      "createdAt": "2026-01-05T10:00:00Z"
    }
  ]
}
```

---

#### POST /integrations

Connect a new integration (OAuth flow).

**Request:**

```http
POST /api/v1/integrations
Authorization: Bearer xxx
Content-Type: application/json

{
  "provider": "GMAIL",
  "redirectUrl": "https://app.ai-orchestration-platform.com/integrations/callback"
}
```

**Response (201 Created):**

```json
{
  "id": "int_123abc",
  "provider": "GMAIL",
  "status": "PENDING",
  "oauthUrl": "https://accounts.google.com/o/oauth2/auth?client_id=...&redirect_uri=...",
  "message": "Complete OAuth flow by visiting oauthUrl"
}
```

**OAuth Flow:**
1. User visits `oauthUrl`
2. Authorizes with Google
3. Redirected to `redirectUrl` with authorization code
4. Frontend calls `/integrations/:id/callback` with code

---

#### POST /integrations/:id/callback

Complete OAuth flow with authorization code.

**Request:**

```http
POST /api/v1/integrations/int_123abc/callback
Authorization: Bearer xxx
Content-Type: application/json

{
  "code": "4/0AX4XfWh..."
}
```

**Response (200 OK):**

```json
{
  "id": "int_123abc",
  "provider": "GMAIL",
  "status": "ACTIVE",
  "message": "Integration connected successfully"
}
```

---

#### DELETE /integrations/:id

Disconnect an integration.

**Request:**

```http
DELETE /api/v1/integrations/int_123abc
Authorization: Bearer xxx
```

**Response (204 No Content):**

```
(no content)
```

---

#### GET /integrations/available

List all available integrations (providers).

**Request:**

```http
GET /api/v1/integrations/available
Authorization: Bearer xxx
```

**Response (200 OK):**

```json
{
  "integrations": [
    {
      "provider": "GMAIL",
      "name": "Gmail",
      "description": "Read and send emails",
      "icon": "https://cdn.../gmail.png",
      "category": "EMAIL",
      "authType": "OAUTH",
      "features": ["read_email", "send_email", "search_emails"]
    },
    {
      "provider": "SLACK",
      "name": "Slack",
      "description": "Send messages and channels",
      "icon": "https://cdn.../slack.png",
      "category": "COMMUNICATION",
      "authType": "OAUTH",
      "features": ["send_message", "create_channel", "add_reaction"]
    }
  ]
}
```

---

## 5. Templates

### 5.1 Template Endpoints

#### GET /templates

List all available templates.

**Request:**

```http
GET /api/v1/templates?category=MARKETING&difficulty=BEGINNER&page=1&limit=20
Authorization: Bearer xxx
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | Filter by category |
| difficulty | string | No | Filter by difficulty (BEGINNER, INTERMEDIATE, ADVANCED) |
| search | string | No | Search in name/description/tags |
| author | string | No | Filter by author (OFFICIAL, COMMUNITY) |
| page | integer | No | Page number |
| limit | integer | No | Items per page |

**Response (200 OK):**

```json
{
  "templates": [
    {
      "id": "tpl_123abc",
      "name": "Email Marketing Campaign",
      "description": "Automate email campaigns with AI-generated content",
      "category": "MARKETING",
      "difficulty": "BEGINNER",
      "estimatedTimeSavings": "2 hours/week",
      "tags": ["email", "marketing", "automation"],
      "requiredIntegrations": ["GMAIL", "OPENAI"],
      "author": "OFFICIAL",
      "popularity": 1234,
      "rating": 4.5,
      "ratingCount": 42
    }
  ],
  "pagination": { /* ... */ }
}
```

---

#### GET /templates/:id

Get template details.

**Request:**

```http
GET /api/v1/templates/tpl_123abc
Authorization: Bearer xxx
```

**Response (200 OK):**

```json
{
  "id": "tpl_123abc",
  "name": "Email Marketing Campaign",
  "description": "Automate email campaigns with AI-generated content",
  "category": "MARKETING",
  "difficulty": "BEGINNER",
  "estimatedTimeSavings": "2 hours/week",
  "tags": ["email", "marketing", "automation"],
  "definition": { /* workflow definition */ },
  "requiredIntegrations": ["GMAIL", "OPENAI"],
  "optionalIntegrations": ["SLACK"],
  "configurationSchema": {
    "type": "object",
    "properties": {
      "senderName": {
        "type": "string",
        "title": "Sender Name",
        "description": "Name to use as sender"
      },
      "tone": {
        "type": "string",
        "title": "Email Tone",
        "enum": ["professional", "friendly", "casual"],
        "default": "professional"
      }
    },
    "required": ["senderName"]
  },
  "author": "OFFICIAL",
  "isPublic": true,
  "popularity": 1234,
  "rating": 4.5,
  "ratingCount": 42,
  "examples": [
    {
      "useCase": "Welcome email series for new customers",
      "setup": "Configure sender name and tone, then connect Gmail"
    }
  ]
}
```

---

#### POST /templates/:id/instantiate

Create a workflow from a template.

**Request:**

```http
POST /api/v1/templates/tpl_123abc/instantiate
Authorization: Bearer xxx
Content-Type: application/json

{
  "name": "My Email Campaign",
  "configuration": {
    "senderName": "Acme Corp",
    "tone": "friendly"
  }
}
```

**Response (201 Created):**

```json
{
  "workflowId": "wf_789ghi",
  "name": "My Email Campaign",
  "status": "ACTIVE",
  "message": "Workflow created from template successfully"
}
```

**Error Responses:**

- **400 Bad Request:** Missing required integrations
- **402 Payment Required:** Workflow limit exceeded
- **422 Unprocessable Entity:** Invalid configuration

---

#### POST /templates/:id/rate

Rate a template.

**Request:**

```http
POST /api/v1/templates/tpl_123abc/rate
Authorization: Bearer xxx
Content-Type: application/json

{
  "rating": 5
}
```

**Response (200 OK):**

```json
{
  "templateId": "tpl_123abc",
  "rating": 5,
  "message": "Rating submitted successfully"
}
```

---

## 6. Organizations & Users

### 6.1 Organization Endpoints

#### GET /organization

Get current organization details.

**Request:**

```http
GET /api/v1/organization
Authorization: Bearer xxx
```

**Response (200 OK):**

```json
{
  "id": "org_456def",
  "name": "Acme Corp",
  "plan": "STARTER",
  "trialEndsAt": "2026-02-08T00:00:00Z",
  "limits": {
    "maxWorkflows": 5,
    "maxIntegrations": 3,
    "maxUsers": 2,
    "usedWorkflows": 3,
    "usedIntegrations": 2,
    "usedUsers": 1
  },
  "createdAt": "2026-01-01T10:00:00Z"
}
```

---

#### PUT /organization

Update organization details.

**Request:**

```http
PUT /api/v1/organization
Authorization: Bearer xxx
Content-Type: application/json

{
  "name": "Acme Corporation"
}
```

**Response (200 OK):**

```json
{
  "id": "org_456def",
  "name": "Acme Corporation",
  "plan": "STARTER",
  "updatedAt": "2026-01-08T11:00:00Z"
}
```

---

#### GET /organization/usage

Get organization usage statistics.

**Request:**

```http
GET /api/v1/organization/usage?period=2026-01
Authorization: Bearer xxx
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| period | string | No | Period in YYYY-MM format (default: current month) |

**Response (200 OK):**

```json
{
  "period": "2026-01",
  "metrics": [
    {
      "metric": "WORKFLOW_EXECUTIONS",
      "quantity": 1234,
      "cost": 12.34
    },
    {
      "metric": "AI_TOKENS_USED",
      "quantity": 500000,
      "cost": 5.00
    },
    {
      "metric": "API_CALLS_MADE",
      "quantity": 500,
      "cost": 0.50
    }
  ],
  "totalCost": 17.84
}
```

---

### 6.2 User Management Endpoints

#### GET /organization/users

List all users in the organization.

**Request:**

```http
GET /api/v1/organization/users
Authorization: Bearer xxx
```

**Response (200 OK):**

```json
{
  "users": [
    {
      "id": "user_123abc",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "OWNER",
      "lastLoginAt": "2026-01-08T09:00:00Z",
      "createdAt": "2026-01-01T10:00:00Z"
    },
    {
      "id": "user_456def",
      "email": "jane@example.com",
      "name": "Jane Smith",
      "role": "MEMBER",
      "lastLoginAt": "2026-01-07T15:00:00Z",
      "createdAt": "2026-01-05T10:00:00Z"
    }
  ]
}
```

---

#### POST /organization/users/invite

Invite a user to the organization.

**Request:**

```http
POST /api/v1/organization/users/invite
Authorization: Bearer xxx
Content-Type: application/json

{
  "email": "newuser@example.com",
  "role": "MEMBER"
}
```

**Response (201 Created):**

```json
{
  "id": "invite_789ghi",
  "email": "newuser@example.com",
  "role": "MEMBER",
  "status": "PENDING",
  "invitedBy": {
    "id": "user_123abc",
    "name": "John Doe"
  },
  "expiresAt": "2026-01-22T10:00:00Z"
}
```

---

#### DELETE /organization/users/:id

Remove a user from the organization.

**Request:**

```http
DELETE /api/v1/organization/users/user_456def
Authorization: Bearer xxx
```

**Response (204 No Content):**

```
(no content)
```

---

## 7. Webhooks

### 7.1 Webhook Endpoints

#### POST /webhooks/:webhookId

Receive webhook from external service (triggers workflow).

**Request:**

```http
POST /api/v1/webhooks/wh_123abc
Content-Type: application/json

{
  "event": "NEW_EMAIL",
  "emailId": "msg_12345",
  "timestamp": "2026-01-08T10:00:00Z"
}
```

**Response (202 Accepted):**

```json
{
  "executionId": "exec_xyz123",
  "status": "PENDING",
  "message": "Workflow execution queued"
}
```

**Note:** No authentication required (public endpoint, validated by webhookId)

---

#### GET /webhooks/:id/logs

Get webhook delivery logs.

**Request:**

```http
GET /api/v1/webhooks/wh_123abc/logs
Authorization: Bearer xxx
```

**Response (200 OK):**

```json
{
  "logs": [
    {
      "id": "log_abc123",
      "status": "SUCCESS",
      "executionId": "exec_xyz123",
      "payload": { /* webhook payload */ },
      "timestamp": "2026-01-08T10:00:00Z"
    }
  ]
}
```

---

## 8. Rate Limiting

### 8.1 Rate Limit Strategy

**Default Limits (per user):**
- **GET requests:** 100 requests/minute
- **POST/PUT/PATCH:** 20 requests/minute
- **DELETE:** 10 requests/minute

**Response Headers:**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704700800
```

**Rate Limit Exceeded (429):**

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

---

## 9. Error Handling

### 9.1 Standard Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context"
  },
  "requestId": "req_abc123"
}
```

### 9.2 Common HTTP Status Codes

| Status | Code | Description |
|--------|------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content returned |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate email) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## 10. API Versioning

### 10.1 Versioning Strategy

**URL Versioning:**
- Current version: `/api/v1/`
- New versions: `/api/v2/`, `/api/v3/`, etc.

**Deprecation Policy:**
- Minimum 6 months notice before deprecation
- Sunset date in response headers: `X-API-Sunset: 2026-07-01`
- Migration guide provided

**Version Discovery:**

```http
GET /api/version
```

**Response (200 OK):**

```json
{
  "currentVersion": "v1",
  "supportedVersions": ["v1"],
  "latestVersion": "v1",
  "deprecationNotices": []
}
```

---

## 11. SDK Examples

### 11.1 JavaScript/TypeScript SDK

```typescript
import { AIOClient } from '@ai-orchestration/sdk';

const client = new AIOClient({
  apiKey: process.env.AI_API_KEY,
});

// List workflows
const workflows = await client.workflows.list({
  status: 'ACTIVE',
  limit: 20,
});

// Execute workflow
const execution = await client.workflows.execute('wf_789ghi', {
  input: { emailId: 'msg_12345' },
});

// Get execution result
const result = await client.executions.get(execution.id);
```

---

### 11.2 Python SDK

```python
from ai_orchestration import AIClient

client = AIClient(api_key="your-api-key")

# List workflows
workflows = client.workflows.list(status="ACTIVE", limit=20)

# Execute workflow
execution = client.workflows.execute(
    "wf_789ghi",
    input={"emailId": "msg_12345"}
)

# Get execution result
result = client.executions.get(execution.id)
```

---

## 12. Testing & Sandbox

### 12.1 Sandbox Environment

**Sandbox URL:** `https://sandbox-api.ai-orchestration-platform.com/api/v1`

**Sandbox Features:**
- Free testing environment
- No actual charges
- Test credit cards
- Mocked external integrations
- Reset daily

---

### 12.2 Testing Best Practices

**Use Test API Keys:**
- Production: Never use in tests
- Sandbox: Safe for automated tests

**Mock External Calls:**
- Use integration test mode
- Mock AI provider responses
- Test error scenarios

---

## 13. Summary

### API Summary

**Total Endpoints:** ~50 endpoints
- Authentication: 5 endpoints
- Workflows: 8 endpoints
- Executions: 5 endpoints
- Integrations: 6 endpoints
- Templates: 5 endpoints
- Organizations: 6 endpoints
- Users: 4 endpoints
- Webhooks: 2 endpoints
- Health/Status: 3 endpoints

**Key Features:**
- RESTful design with JSON
- JWT authentication with refresh tokens
- Rate limiting per user
- Comprehensive error handling
- Pagination for list endpoints
- Versioned API (/api/v1/)
- Webhook support
- SDK libraries (JS/Python)

### Next Steps

**Immediate:**
1. Implement authentication endpoints
2. Build workflow CRUD operations
3. Create integration connectors
4. Setup rate limiting

**Short-term:**
1. Implement execution engine
2. Add webhook support
3. Build template library
4. Create SDK libraries

**Long-term:**
1. Add GraphQL support (optional)
2. Implement real-time updates (WebSocket)
3. Create developer portal
4. API documentation site (Swagger/OpenAPI)

---

**Document Status:** ✅ Complete
**Next Document:** Infrastructure Plan (docs/technical/infrastructure.md)
**Last Updated:** January 8, 2026
