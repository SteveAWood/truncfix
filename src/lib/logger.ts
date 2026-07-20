import { UsageLog } from '@/types';

/**
 * Sends a usage event to the logging API.
 * Fails silently so logging never blocks the user.
 */
export async function logUsage(event: UsageLog): Promise<void> {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      }),
    });
  } catch {
    // Logging must never break the main flow
  }
}
