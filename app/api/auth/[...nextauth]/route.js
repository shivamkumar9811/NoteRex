import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-options';

const handler = NextAuth(authOptions);

async function wrappedHandler(req, ctx) {
  try {
    return await handler(req, ctx);
  } catch (e) {
    console.error('NextAuth handler error:', e?.message || e);
    return NextResponse.json(
      { error: 'Authentication error. Check NEXTAUTH_SECRET and NEXTAUTH_URL on Vercel.' },
      { status: 500 }
    );
  }
}

export const GET = wrappedHandler;
export const POST = wrappedHandler;
