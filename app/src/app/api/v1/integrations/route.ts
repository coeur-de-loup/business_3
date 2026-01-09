/**
 * Integrations API Route
 * GET /api/v1/integrations - List integrations
 * POST /api/v1/integrations - Create integration
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
  parsePaginationParams,
  calculatePagination,
} from '@/lib/api-utils';
import type { CreateIntegrationRequest, IntegrationResponse, PaginatedResponse } from '@/types/api';

// Validation schema for creating integration
const createIntegrationSchema = z.object({
  provider: z.enum([
    'OPENAI',
    'ANTHROPIC',
    'GOOGLE_GEMINI',
    'COHERE',
    'SLACK',
    'MICROSOFT_TEAMS',
    'DISCORD',
    'GMAIL',
    'OUTLOOK',
    'SENDGRID',
    'RESEND',
    'HUBSPOT',
    'SALESFORCE',
    'PIPEDRIVE',
    'TRELLO',
    'ASANA',
    'MONDAY',
    'NOTION',
    'LINEAR',
    'SHOPIFY',
    'WOO_COMMERCE',
    'SQUARE',
    'MAILCHIMP',
    'CONVERTKIT',
    'ACTIVECAMPAIGN',
    'STRIPE',
    'PAYPAL',
    'CALENDLY',
    'ACUITY',
    'ZAPIER',
    'MAKE',
    'GOOGLE_SHEETS',
    'AIRTABLE',
  ]),
  credentials: z.record(z.string(), z.any()).optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

// GET /api/v1/integrations - List integrations
export async function GET(request: NextRequest) {
  return withAuth(async (userId, organizationId) => {
    try {
      const { page, pageSize, sortBy, sortOrder } = parsePaginationParams(request.nextUrl);

      const [integrations, total] = await Promise.all([
        prisma.integration.findMany({
          where: { organizationId },
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.integration.count({
          where: { organizationId },
        }),
      ]);

      const response: PaginatedResponse<IntegrationResponse> = {
        data: integrations.map((integration) => ({
          id: integration.id,
          provider: integration.provider,
          status: integration.status,
          lastUsedAt: integration.lastUsedAt ? integration.lastUsedAt.toISOString() : null,
          createdAt: integration.createdAt.toISOString(),
          updatedAt: integration.updatedAt.toISOString(),
        })) as IntegrationResponse[],
        pagination: calculatePagination(total, page, pageSize),
      };

      return apiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// POST /api/v1/integrations - Create integration
export async function POST(request: NextRequest) {
  return withAuth(async (userId, organizationId) => {
    try {
      // Validate request body
      const bodyResult = await validateBody<CreateIntegrationRequest>(
        await request.json(),
        createIntegrationSchema
      );

      if ('error' in bodyResult) {
        return bodyResult.error;
      }

      const data = bodyResult.data;

      // Check if integration already exists
      const existingIntegration = await prisma.integration.findFirst({
        where: {
          organizationId,
          provider: data.provider,
        },
      });

      if (existingIntegration) {
        return apiError('Integration already exists for this provider', 400);
      }

      // Create integration
      const integration = await prisma.integration.create({
        data: {
          provider: data.provider,
          credentials: data.credentials as any,
          settings: data.settings as any,
          organizationId,
          status: 'ACTIVE',
        },
      });

      const response: IntegrationResponse = {
        id: integration.id,
        provider: integration.provider,
        status: integration.status,
        lastUsedAt: integration.lastUsedAt ? integration.lastUsedAt.toISOString() : null,
        createdAt: integration.createdAt.toISOString(),
        updatedAt: integration.updatedAt.toISOString(),
      };

      return apiSuccess(response, 201);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
