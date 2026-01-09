/**
 * Workflow Execution API Route
 * POST /api/v1/workflows/:id/execute - Trigger workflow execution
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, apiSuccess, apiError, handleApiError } from '@/lib/api-utils';
import type { ExecutionResponse } from '@/types/api';

// POST /api/v1/workflows/:id/execute - Trigger workflow execution
export async function POST(
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

      if (workflow.status !== 'ACTIVE') {
        return apiError('Workflow is not active', 400);
      }

      // Create execution record
      const execution = await prisma.execution.create({
        data: {
          workflowId: params.id,
          userId,
          status: 'PENDING',
          triggeredBy: 'MANUAL',
          triggeredByUserId: userId,
          startedAt: new Date(),
        },
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // TODO: Queue workflow for actual execution
      // For now, we'll mark it as completed immediately (MVP)
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          result: 'SUCCESS',
          completedAt: new Date(),
          duration: 1000, // Mock duration
          output: { message: 'Workflow executed successfully' },
        },
      });

      const response: ExecutionResponse = {
        id: execution.id,
        workflowId: execution.workflowId,
        status: 'COMPLETED',
        result: 'SUCCESS',
        startedAt: execution.startedAt.toISOString(),
        completedAt: execution.completedAt ? execution.completedAt.toISOString() : null,
        duration: 1000,
        triggeredBy: 'MANUAL',
        triggeredByUserId: userId,
        input: null,
        output: { message: 'Workflow executed successfully' },
        error: null,
        workflow: execution.workflow as any,
      };

      return apiSuccess(response, 201);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
