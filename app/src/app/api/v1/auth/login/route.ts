/**
 * Login API Route
 * POST /api/v1/auth/login
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticateUser, generateToken, setSessionCookie } from '@/lib/auth';
import { apiSuccess, apiError, validateBody, handleApiError } from '@/lib/api-utils';
import type { LoginRequest, AuthResponse } from '@/types/api';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const bodyResult = await validateBody<LoginRequest>(
      await request.json(),
      loginSchema
    );

    if ('error' in bodyResult) {
      return bodyResult.error;
    }

    const { email, password } = bodyResult.data;

    // Authenticate user
    const user = await authenticateUser(email, password);

    if (!user) {
      return apiError('Invalid email or password', 401);
    }

    // Generate token
    const token = await generateToken(user);

    // Set session cookie
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

    return apiSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}
