/**
 * Single Workflow API Route
 * GET /api/v1/workflows/:id - Get workflow details
 * PATCH /api/v1/workflows/:id - Update workflow
 * DELETE /api/v1/workflows/:id - Delete workflow
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  withAuth,
  apiSuccess,
  apiError,
  validateBody,
  handleApiError,
} from '@/lib/api-utils';
import type { UpdateWorkflowRequest, WorkflowResponse } from '@/types/api';

// Validation schema for updating workflow
const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z
    .enum(['MARKETING', 'SALES', 'OPERATIONS', 'CUSTOMER_SUPPORT', 'ADMIN', 'CUSTOM'])
    .optional(),
  definition: z
    .object({
      nodes: z.array(z.any()),
      edges: z.array(z.any()),
      variables: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED', 'DRAFT']).optional(),
  schedule: z
    .object({
      type: z.enum(['cron', 'interval']),
      expression: z.string().optional(),
      interval: z.number().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
  triggers: z
    .array(
      z.object({
        type: z.enum(['webhook', 'manual', 'schedule', 'api']),
        config: z.record(z.string(), z.any()).optional(),
      })
    )
    .optional(),
});

// GET /api/v1/workflows/:id - Get workflow details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId, organizationId) => {
    try {
      const { id } = await params;
      const workflow = await prisma.workflow.findFirst({
        where: {
          id,
          organizationId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              executions: true,
            },
          },
        },
      });

      if (!workflow) {
        return apiError('Workflow not found', 404);
      }

      const response: WorkflowResponse = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        category: workflow.category,
        status: workflow.status,
        definition: workflow.definition as any,
        schedule: workflow.schedule as any,
        triggers: workflow.triggers as any,
        createdAt: workflow.createdAt.toISOString(),
        updatedAt: workflow.updatedAt.toISOString(),
        createdBy: workflow.createdBy as any,
        _count: workflow._count as any,
      };

      return apiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// PATCH /api/v1/workflows/:id - Update workflow
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId, organizationId) => {
    try {
      const { id } = await params;
      // Validate request body
      const bodyResult = await validateBody<UpdateWorkflowRequest>(
        await request.json(),
        updateWorkflowSchema
      );

      if ('error' in bodyResult) {
        return bodyResult.error;
      }

      const data = bodyResult.data;

      // Check if workflow exists and belongs to organization
      const existingWorkflow = await prisma.workflow.findFirst({
        where: {
          id,
          organizationId,
        },
      });

      if (!existingWorkflow) {
        return apiError('Workflow not found', 404);
      }

      // Update workflow
      const workflow = await prisma.workflow.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.category && { category: data.category }),
          ...(data.definition && { definition: data.definition as any }),
          ...(data.status && { status: data.status }),
          ...(data.schedule && { schedule: data.schedule as any }),
          ...(data.triggers && { triggers: data.triggers as any }),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              executions: true,
            },
          },
        },
      });

      const response: WorkflowResponse = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        category: workflow.category,
        status: workflow.status,
        definition: workflow.definition as any,
        schedule: workflow.schedule as any,
        triggers: workflow.triggers as any,
        createdAt: workflow.createdAt.toISOString(),
        updatedAt: workflow.updatedAt.toISOString(),
        createdBy: workflow.createdBy as any,
        _count: workflow._count as any,
      };

      return apiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// DELETE /api/v1/workflows/:id - Delete workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId, organizationId) => {
    try {
      const { id } = await params;
      // Check if workflow exists and belongs to organization
      const existingWorkflow = await prisma.workflow.findFirst({
        where: {
          id,
          organizationId,
        },
      });

      if (!existingWorkflow) {
        return apiError('Workflow not found', 404);
      }

      // Delete workflow (cascade will delete executions and logs)
      await prisma.workflow.delete({
        where: { id },
      });

      return apiSuccess({ message: 'Workflow deleted successfully' });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
