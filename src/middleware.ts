import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './lib/rateLimit';

export async function middleware(request: NextRequest) {
  // Get real IP (works behind Cloudflare)
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const path = request.nextUrl.pathname;

  // Stricter limits for API routes
  const isApi = path.startsWith('/api/');
  const limit = isApi ? 25 : 80;
  const windowSeconds = 60;

  const { success, remaining, reset } = await rateLimit(
    `${ip}:${isApi ? 'api' : 'general'}`,
    limit,
    windowSeconds
  );

  if (!success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.max(1, reset - Math.floor(Date.now() / 1000))),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};