import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const baseUrl = process.env.AUTH0_BASE_URL || req.nextUrl.origin;
  return NextResponse.redirect(new URL('/api/auth/logout?returnTo=' + encodeURIComponent(baseUrl + '/'), req.nextUrl.origin));
}
