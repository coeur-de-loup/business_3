/**
 * API Type Definitions
 * Shared types for API requests/responses
 */

import type { UserRole, Plan, WorkflowCategory, WorkflowStatus, ExecutionStatus, ExecutionResult, TriggeredBy, IntegrationProvider, IntegrationStatus, TemplateDifficulty, TemplateAuthor } from '@prisma/client';

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    organizationId: string;
  };
  token: string;
}

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  category: WorkflowCategory;
  definition: WorkflowDefinition;
  schedule?: ScheduleConfig;
  triggers?: TriggerConfig[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  category?: WorkflowCategory;
  definition?: WorkflowDefinition;
  status?: WorkflowStatus;
  schedule?: ScheduleConfig | null;
  triggers?: TriggerConfig[];
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    config?: Record<string, any>;
    integration?: IntegrationProvider;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface ScheduleConfig {
  type: 'cron' | 'interval';
  expression?: string;
  interval?: number;
  timezone?: string;
}

export interface TriggerConfig {
  type: 'webhook' | 'manual' | 'schedule' | 'api';
  config?: Record<string, any>;
}

export interface WorkflowResponse {
  id: string;
  name: string;
  description: string | null;
  category: WorkflowCategory;
  status: WorkflowStatus;
  definition: WorkflowDefinition;
  schedule: ScheduleConfig | null;
  triggers: TriggerConfig[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  _count: {
    executions: number;
  };
}

// ============================================================================
// EXECUTION TYPES
// ============================================================================

export interface CreateExecutionRequest {
  workflowId: string;
  input?: Record<string, any>;
}

export interface ExecutionResponse {
  id: string;
  status: ExecutionStatus;
  result: ExecutionResult;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  input: Record<string, any> | null;
  output: Record<string, any> | null;
  error: Record<string, any> | null;
  triggeredBy: TriggeredBy;
  triggeredByUserId: string | null;
  workflow: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface ExecutionLogResponse {
  id: string;
  level: string;
  stepId: string | null;
  message: string;
  metadata: Record<string, any> | null;
  timestamp: string;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface CreateIntegrationRequest {
  provider: IntegrationProvider;
  credentials: Record<string, any>;
  settings?: Record<string, any>;
}

export interface UpdateIntegrationRequest {
  credentials?: Record<string, any>;
  settings?: Record<string, any>;
  status?: IntegrationStatus;
}

export interface IntegrationResponse {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  webhookUrl: string | null;
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface TemplateResponse {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  tags: string[];
  difficulty: TemplateDifficulty;
  estimatedTimeSavings: string;
  definition: WorkflowDefinition;
  requiredIntegrations: string[];
  optionalIntegrations: string[];
  configurationSchema: Record<string, any> | null;
  author: TemplateAuthor;
  isPublic: boolean;
  popularity: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InstantiateTemplateRequest {
  templateId: string;
  name: string;
  description?: string;
  configuration?: Record<string, any>;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successRate: number;
  recentExecutions: ExecutionResponse[];
  upcomingSchedules: Array<{
    workflowId: string;
    workflowName: string;
    nextRun: string;
  }>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
