/**
 * Workflows API Route
 * GET /api/v1/workflows - List workflows
 * POST /api/v1/workflows - Create workflow
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth, apiSuccess, apiError, validateBody, handleApiError, parsePaginationParams, calculatePagination } from '@/lib/api-utils';
import type { CreateWorkflowRequest, WorkflowResponse, PaginatedResponse } from '@/types/api';

// Validation schema for creating workflow
const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  category: z.enum(['MARKETING', 'SALES', 'OPERATIONS', 'CUSTOMER_SUPPORT', 'ADMIN', 'CUSTOM']),
  definition: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    variables: z.record(z.string(), z.any()).optional(),
  }),
  schedule: z.object({
    type: z.enum(['cron', 'interval']),
    expression: z.string().optional(),
    interval: z.number().optional(),
    timezone: z.string().optional(),
  }).optional(),
  triggers: z.array(z.object({
    type: z.enum(['webhook', 'manual', 'schedule', 'api']),
    config: z.record(z.string(), z.any()).optional(),
  })).optional(),
});

// GET /api/v1/workflows - List workflows
export async function GET(request: NextRequest) {
  return withAuth(async (userId, organizationId) => {
    try {
      const { page, pageSize, sortBy, sortOrder } = parsePaginationParams(request.nextUrl);

      const [workflows, total] = await Promise.all([
        prisma.workflow.findMany({
          where: { organizationId },
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
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.workflow.count({
          where: { organizationId },
        }),
      ]);

      const response: PaginatedResponse<WorkflowResponse> = {
        data: workflows.map((workflow) => ({
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
          createdBy: workflow.createdBy,
          _count: workflow._count,
        })),
        pagination: calculatePagination(total, page, pageSize),
      };

      return apiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// POST /api/v1/workflows - Create workflow
export async function POST(request: NextRequest) {
  return withAuth(async (userId, organizationId) => {
    try {
      // Validate request body
      const bodyResult = await validateBody<CreateWorkflowRequest>(
        await request.json(),
        createWorkflowSchema
      );

      if ('error' in bodyResult) {
        return bodyResult.error;
      }

      const data = bodyResult.data;

      // Create workflow
      const workflow = await prisma.workflow.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          definition: data.definition as any,
          schedule: data.schedule as any,
          triggers: data.triggers as any,
          organizationId,
          createdById: userId,
          status: 'DRAFT',
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

      return apiSuccess(response, 201);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
