'use client';

import { createContext, useContext } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

/**
 * Auth Context
 * 
 * Wrapper around NextAuth for client-side auth state
 */

// Auth Context
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  logout: async () => {},
  signup: async () => {},
  signInWithGoogle: async () => {},
});

/**
 * Auth Provider Component
 * Wraps the app to provide auth state globally using NextAuth
 */
export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  
  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user;
  const sessionUser = session?.user || null;

  // Map NextAuth user to our user format
  const user = sessionUser ? {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    avatar: sessionUser.image,
  } : null;

  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const login = async (email, password) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  /**
   * Sign up with email and password
   * @param {string} email
   * @param {string} password
   * @param {string} name - Optional name
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const signup = async (email, password, name) => {
    try {
      // First, create the user account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }
      
      // After successful signup, automatically sign in
      const loginResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (loginResult?.error) {
        return { success: false, error: loginResult.error };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  /**
   * Sign in with Google
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const signInWithGoogle = async () => {
    try {
      await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: true,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Google sign-in failed' };
    }
  };

  /**
   * Logout
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      await signOut({
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    signup,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 * Custom hook to access auth context
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
