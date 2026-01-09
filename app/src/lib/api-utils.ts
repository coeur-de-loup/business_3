/**
 * API Utilities
 * Helper functions for API route handlers
 */

import { NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import type { ApiError, ValidationError } from '@/types/api';

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/**
 * Create a standardized error response
 */
export function apiError(
  message: string,
  statusCode: number = 400,
  details?: Record<string, any>
): NextResponse {
  return NextResponse.json(
    {
      error: getErrorType(statusCode),
      message,
      details,
    },
    { status: statusCode }
  );
}

/**
 * Create a validation error response
 */
export function validationError(
  errors: ValidationError[]
): NextResponse {
  return NextResponse.json(
    {
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: { errors },
    },
    { status: 400 }
  );
}

/**
 * Create a success response
 */
export function apiSuccess<T>(data: T, statusCode: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status: statusCode }) as NextResponse<T>;
}

/**
 * Get error type from status code
 */
function getErrorType(statusCode: number): string {
  const errorTypes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE',
  };

  return errorTypes[statusCode] || 'ERROR';
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate request body against a Zod schema
 */
export async function validateBody<T>(
  body: unknown,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const data = await schema.parseAsync(body);
    return { data };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.issues.map((issue: any) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return {
        error: validationError(errors) as unknown as NextResponse,
      };
    }

    return {
      error: apiError('Invalid request data', 400) as unknown as NextResponse,
    };
  }
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Authenticate API request
 */
export async function withAuth<T>(
  handler: (userId: string, organizationId: string, role: string) => Promise<NextResponse<T>>
): Promise<NextResponse> {
  const { getSession } = await import('@/lib/auth');
  const session = await getSession();

  if (!session) {
    return apiError('Unauthorized') as unknown as NextResponse;
  }

  return handler(session.userId, session.organizationId, session.role);
}

/**
 * Require specific role for API request
 */
export async function withRole<T>(
  allowedRoles: string[],
  handler: (userId: string, organizationId: string, role: string) => Promise<NextResponse<T>>
): Promise<NextResponse> {
  return withAuth(async (userId, organizationId, role) => {
    if (!allowedRoles.includes(role)) {
      return apiError('Insufficient permissions', 403) as unknown as NextResponse;
    }

    return handler(userId, organizationId, role);
  });
}

// ============================================================================
// QUERY PARAMETER PARSING
// ============================================================================

/**
 * Parse pagination parameters
 */
export function parsePaginationParams(url: URL): {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
} {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10))
  );
  const sortBy = url.searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  return { page, pageSize, sortBy, sortOrder };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  pageSize: number
) {
  const totalPages = Math.ceil(total / pageSize);

  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any;

      if (prismaError.code === 'P2002') {
        return apiError('A record with this value already exists', 409);
      }

      if (prismaError.code === 'P2025') {
        return apiError('Record not found', 404);
      }
    }

    return apiError(error.message, 500);
  }

  return apiError('An unexpected error occurred', 500);
}
