import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';

export async function proxy(request: NextRequest) {
  // Check if Auth0 is properly configured
  if (!process.env.AUTH0_SECRET || !process.env.AUTH0_DOMAIN || !process.env.AUTH0_CLIENT_ID) {
    // In development, provide helpful error
    if (process.env.NODE_ENV === 'development') {
      console.warn('Auth0 environment variables are missing. Please set AUTH0_SECRET, AUTH0_DOMAIN, and AUTH0_CLIENT_ID in .env.local');
    }
    // Allow request to pass through if Auth0 isn't configured (for build/testing)
    return NextResponse.next();
  }

  try {
    return await auth0.middleware(request);
  } catch (error: any) {
    // Handle Auth0 configuration errors gracefully
    if (error.message?.includes('ikm') || error.message?.includes('secret')) {
      console.error('Auth0 secret configuration error. Ensure AUTH0_SECRET is a valid 64-character hex string.');
      // In development, return a helpful error page
      if (process.env.NODE_ENV === 'development') {
        return new NextResponse(
          'Auth0 configuration error: Please set AUTH0_SECRET in .env.local (generate with: openssl rand -hex 32)',
          { status: 500 }
        );
      }
    }
    // For other errors, pass through
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

