/**
 * Authentication Utilities
 * Handles password hashing, JWT token generation/validation, and session management
 */

import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

// ============================================================================
// CONFIGURATION
// ============================================================================

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this'
);

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';

// ============================================================================
// PASSWORD UTILITIES
// ============================================================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// JWT TOKEN UTILITIES
// ============================================================================

/**
 * Generate a JWT token for a user
 */
export async function generateToken(user: User): Promise<string> {
  const payload = {
    userId: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<{
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      organizationId: payload.organizationId as string,
      role: payload.role as string,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export const SESSION_COOKIE_NAME = 'auth-token';

/**
 * Set the auth cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Clear the auth cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get the current session from cookie
 */
export async function getSession(): Promise<{
  userId: string;
  email: string;
  organizationId: string;
  role: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  try {
    return await verifyToken(token.value);
  } catch {
    return null;
  }
}

// ============================================================================
// USER AUTHENTICATION
// ============================================================================

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return user;
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
  });
}

/**
 * Get server session with user data (for API routes)
 */
export async function getServerSession(): Promise<{
  user: {
    id: string;
    email: string;
    organizationId: string;
    role: string;
  } | null;
}> {
  const session = await getSession();

  return {
    user: session || null,
  };
}

/**
 * Register a new user and organization
 */
export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}): Promise<{ user: User; organizationId: string }> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: data.organizationName,
      plan: 'STARTER',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
    },
  });

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash,
      organizationId: organization.id,
      role: 'OWNER',
    },
  });

  return {
    user,
    organizationId: organization.id,
  };
}
