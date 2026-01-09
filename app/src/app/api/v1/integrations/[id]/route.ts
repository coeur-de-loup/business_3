/**
 * Single Integration API Route
 * GET /api/v1/integrations/:id - Get integration details
 * PATCH /api/v1/integrations/:id - Update integration
 * DELETE /api/v1/integrations/:id - Delete integration
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  withAuth,
  apiSuccess,
  apiError,
  handleApiError,
} from '@/lib/api-utils';
import type { IntegrationResponse } from '@/types/api';

// GET /api/v1/integrations/:id - Get integration details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId, organizationId) => {
    try {
      const { id } = await params;
      const integration = await prisma.integration.findFirst({
        where: {
          id,
          organizationId,
        },
      });

      if (!integration) {
        return apiError('Integration not found', 404);
      }

      const response: IntegrationResponse = {
        id: integration.id,
        provider: integration.provider,
        status: integration.status,
        lastUsedAt: integration.lastUsedAt ? integration.lastUsedAt.toISOString() : null,
        createdAt: integration.createdAt.toISOString(),
        updatedAt: integration.updatedAt.toISOString(),
      };

      return apiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// DELETE /api/v1/integrations/:id - Delete integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (userId, organizationId) => {
    try {
      const { id } = await params;
      // Check if integration exists and belongs to organization
      const existingIntegration = await prisma.integration.findFirst({
        where: {
          id,
          organizationId,
        },
      });

      if (!existingIntegration) {
        return apiError('Integration not found', 404);
      }

      // Delete integration
      await prisma.integration.delete({
        where: { id },
      });

      return apiSuccess({ message: 'Integration deleted successfully' });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
