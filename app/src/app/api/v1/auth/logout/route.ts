/**
 * Logout API Route
 * POST /api/v1/auth/logout
 */

import { NextRequest } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  // Clear session cookie
  await clearSessionCookie();

  return apiSuccess({ message: 'Logged out successfully' });
}
