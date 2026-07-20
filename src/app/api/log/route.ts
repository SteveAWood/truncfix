import { NextRequest, NextResponse } from 'next/server';
import { appendFile, mkdir } from 'fs/promises';
import path from 'path';
import { rateLimit } from '@/lib/rateLimit';

/**
 * Lightweight usage logger with Redis rate limiting.
 * Only this endpoint is rate-limited (safe – runs in Node.js runtime).
 */
export async function POST(request: NextRequest) {
  try {
    // Get real IP (works behind Cloudflare)
    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Rate limit: 20 requests per 60 seconds per IP
    const { success } = await rateLimit(`log:${ip}`, 20, 60);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Basic shape validation
    if (!body.event || !body.timestamp) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const entry = {
      ...body,
      ip,
      receivedAt: new Date().toISOString(),
    };

    const dataDir = path.join(process.cwd(), 'data');
    await mkdir(dataDir, { recursive: true });

    const logPath = path.join(dataDir, 'usage.log');
    await appendFile(logPath, JSON.stringify(entry) + '\n', 'utf8');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Logging error:', err);
    // Still return 200 so the client is never blocked by logging failures
    return NextResponse.json({ ok: false });
  }
}