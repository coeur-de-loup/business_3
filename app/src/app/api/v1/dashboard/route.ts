/**
 * Dashboard API Route
 * GET /api/v1/dashboard
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, apiSuccess, handleApiError } from '@/lib/api-utils';
import type { DashboardStats } from '@/types/api';

export async function GET(request: NextRequest) {
  return withAuth(async (userId, organizationId) => {
    try {
      // Get workflow counts
      const totalWorkflows = await prisma.workflow.count({
        where: { organizationId },
      });

      const activeWorkflows = await prisma.workflow.count({
        where: {
          organizationId,
          status: 'ACTIVE',
        },
      });

      // Get execution counts
      const [totalExecutions, completedExecutions] = await Promise.all([
        prisma.execution.count({
          where: {
            workflow: { organizationId },
          },
        }),
        prisma.execution.count({
          where: {
            workflow: { organizationId },
            result: 'SUCCESS',
          },
        }),
      ]);

      const successRate =
        totalExecutions > 0
          ? Math.round((completedExecutions / totalExecutions) * 100)
          : 0;

      // Get recent executions
      const recentExecutions = await prisma.execution.findMany({
        where: {
          workflow: { organizationId },
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
          startedAt: 'desc',
        },
        take: 10,
      });

      // Format response
      const stats: DashboardStats = {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        successRate,
        recentExecutions: recentExecutions.map((exec) => ({
          id: exec.id,
          workflowId: exec.workflowId,
          status: exec.status,
          result: exec.result,
          startedAt: exec.startedAt.toISOString(),
          completedAt: exec.completedAt?.toISOString() || null,
          duration: exec.duration,
          input: exec.input as Record<string, any> | null,
          output: exec.output as Record<string, any> | null,
          error: exec.error as Record<string, any> | null,
          triggeredBy: exec.triggeredBy,
          triggeredByUserId: exec.triggeredByUserId,
          workflow: {
            id: exec.workflow.id,
            name: exec.workflow.name,
          },
          user: exec.user
            ? {
                id: exec.user.id,
                name: exec.user.name,
                email: exec.user.email,
              }
            : null,
        })),
        upcomingSchedules: [],
      };

      return apiSuccess(stats);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
