/**
 * Get Current User API Route
 * GET /api/v1/auth/me
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError('Not authenticated', 401);
    }

    // Return user data (exclude sensitive fields)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };

    return apiSuccess(userData);
  } catch (error) {
    console.error('Error getting current user:', error);
    return apiError('Failed to get user data', 500);
  }
}
