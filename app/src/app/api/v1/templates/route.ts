/**
 * Templates API Route
 * GET /api/v1/templates - List templates
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, apiSuccess, handleApiError, parsePaginationParams, calculatePagination } from '@/lib/api-utils';
import type { TemplateResponse, PaginatedResponse } from '@/types/api';

// GET /api/v1/templates - List templates
export async function GET(request: NextRequest) {
  return withAuth(async (userId, organizationId) => {
    try {
      const { page, pageSize, sortBy, sortOrder } = parsePaginationParams(request.nextUrl);

      const [templates, total] = await Promise.all([
        prisma.template.findMany({
          where: {
            isPublic: true,
          },
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.template.count({
          where: {
            isPublic: true,
          },
        }),
      ]);

      const response: PaginatedResponse<TemplateResponse> = {
        data: templates.map((template) => ({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          tags: template.tags,
          difficulty: template.difficulty,
          estimatedTimeSavings: template.estimatedTimeSavings,
          requiredIntegrations: template.requiredIntegrations,
          author: template.author,
          isPublic: template.isPublic,
          popularity: template.popularity,
          rating: template.rating,
          ratingCount: template.ratingCount,
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString(),
        })) as TemplateResponse[],
        pagination: calculatePagination(total, page, pageSize),
      };

      return apiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
