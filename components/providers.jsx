'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';

/**
 * Providers Component
 * Wraps all client-side providers (SessionProvider, AuthProvider)
 * This must be a Client Component to use React Context
 */
export function Providers({ children }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </SessionProvider>
  );
}
