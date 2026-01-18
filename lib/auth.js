import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

/**
 * Get server-side session
 * Use this in Server Components and API routes
 */
export async function getSession() {
  try {
    return await getServerSession(authOptions);
  } catch (e) {
    console.error('getSession error:', e?.message || e);
    return null;
  }
}

/**
 * Get current user from session
 * @returns {Promise<Object|null>} User object or null
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Require authentication
 * Throws error if user is not authenticated
 * @returns {Promise<Object>} User object
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
