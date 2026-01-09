/**
 * Workflow Executions API Route
 * GET /api/v1/workflows/:id/executions - Get workflow execution history
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, apiSuccess, apiError, handleApiError, parsePaginationParams, calculatePagination } from '@/lib/api-utils';
import type { ExecutionResponse, PaginatedResponse } from '@/types/api';

// GET /api/v1/workflows/:id/executions - Get workflow execution history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId, organizationId) => {
    try {
      // Check if workflow exists and belongs to organization
      const workflow = await prisma.workflow.findFirst({
        where: {
          id: params.id,
          organizationId,
        },
      });

      if (!workflow) {
        return apiError('Workflow not found', 404);
      }

      const { page, pageSize, sortBy, sortOrder } = parsePaginationParams(request.nextUrl);

      const [executions, total] = await Promise.all([
        prisma.execution.findMany({
          where: {
            workflowId: params.id,
          },
          include: {
            workflow: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.execution.count({
          where: {
            workflowId: params.id,
          },
        }),
      ]);

      const response: PaginatedResponse<ExecutionResponse> = {
        data: executions.map((execution) => ({
          id: execution.id,
          workflowId: execution.workflowId,
          status: execution.status,
          result: execution.result,
          startedAt: execution.startedAt.toISOString(),
          completedAt: execution.completedAt ? execution.completedAt.toISOString() : null,
          duration: execution.duration,
          triggeredBy: execution.triggeredBy,
          workflow: execution.workflow as any,
          user: execution.user as any,
        })) as ExecutionResponse[],
        pagination: calculatePagination(total, page, pageSize),
      };

      return apiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
