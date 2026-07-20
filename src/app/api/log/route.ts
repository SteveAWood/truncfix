import { NextRequest, NextResponse } from 'next/server';
import { appendFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * Simple append-only usage logger.
 * Writes one JSON line per event to data/usage.log
 * This is deliberately lightweight and dependency-free.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic shape validation
    if (!body.event || !body.timestamp) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

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
    // Still return 200 so the client is never blocked
    return NextResponse.json({ ok: false });
  }
}
