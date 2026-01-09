/**
 * Template Usage API Route
 * POST /api/v1/templates/:id/use - Use template to create workflow
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, apiSuccess, apiError, handleApiError } from '@/lib/api-utils';

// POST /api/v1/templates/:id/use - Use template to create workflow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId, organizationId) => {
    try {
      const { id } = await params;
      // Get template
      const template = await prisma.template.findUnique({
        where: { id },
      });

      if (!template) {
        return apiError('Template not found', 404);
      }

      // Create workflow from template
      const workflow = await prisma.workflow.create({
        data: {
          name: `${template.name} (Copy)`,
          description: template.description,
          category: template.category,
          definition: template.definition as any,
          organizationId,
          createdById: userId,
          status: 'DRAFT',
        },
      });

      // Increment template popularity
      await prisma.template.update({
        where: { id },
        data: {
          popularity: {
            increment: 1,
          },
        },
      });

      return apiSuccess(
        {
          workflowId: workflow.id,
          message: 'Workflow created from template successfully',
        },
        201
      );
    } catch (error) {
      return handleApiError(error);
    }
  });
}
