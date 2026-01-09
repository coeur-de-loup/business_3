/**
 * Register API Route
 * POST /api/v1/auth/register
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { registerUser } from '@/lib/auth';
import { apiSuccess, apiError, validateBody, handleApiError } from '@/lib/api-utils';
import type { RegisterRequest, AuthResponse } from '@/types/api';

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  organizationName: z.string().min(1, 'Organization name is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const bodyResult = await validateBody<RegisterRequest>(
      await request.json(),
      registerSchema
    );

    if ('error' in bodyResult) {
      return bodyResult.error;
    }

    const data = bodyResult.data;

    // Register user
    const { user, organizationId } = await registerUser({
      email: data.email,
      password: data.password,
      name: data.name,
      organizationName: data.organizationName,
    });

    // Generate token
    const { generateToken } = await import('@/lib/auth');
    const token = await generateToken(user);

    // Set session cookie
    const { setSessionCookie } = await import('@/lib/auth');
    await setSessionCookie(token);

    // Return response
    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      token,
    };

    return apiSuccess(response, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists') {
      return apiError('A user with this email already exists', 409);
    }

    return handleApiError(error);
  }
}
