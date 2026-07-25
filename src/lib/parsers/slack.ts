import { ParseResult, SourceFile } from '@/types';

/**
 * Parse Slack export JSON.
 * Typical shapes:
 *  - Array of messages: [{ user, text, ts, ... }]
 *  - { messages: [...] }
 */
export function parseSlack(text: string, filename: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return plainFallback(text, filename);
  }

  let list: unknown[] = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.messages)) list = obj.messages;
  }

  if (list.length === 0) return plainFallback(text, filename);

  const files: SourceFile[] = [];
  list.forEach((item, i) => {
    if (!item || typeof item !== 'object') return;
    const m = item as Record<string, unknown>;
    const user = String(m.user || m.username || (m.user_profile && (m.user_profile as Record<string, unknown>).display_name) || 'Unknown');
    const textContent = String(m.text || m.message || '');
    const ts = String(m.ts || m.timestamp || '');
    if (!textContent.trim()) return;

    const block = ts ? `[${ts}] ${user}: ${textContent}` : `${user}: ${textContent}`;
    files.push({
      path: `${filename} :: msg-${String(i + 1).padStart(4, '0')}`,
      content: block,
      charCount: block.length,
    });
  });

  if (files.length === 0) return plainFallback(text, filename);

  return {
    files,
    totalChars: files.reduce((s, f) => s + f.charCount, 0),
    fileCount: files.length,
    detectedType: 'slack',
  };
}

function plainFallback(text: string, filename: string): ParseResult {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const files: SourceFile[] = (blocks.length ? blocks : [text]).map((block, i) => ({
    path: `${filename} :: block-${String(i + 1).padStart(4, '0')}`,
    content: block,
    charCount: block.length,
  }));
  return {
    files,
    totalChars: files.reduce((s, f) => s + f.charCount, 0),
    fileCount: files.length,
    detectedType: 'slack',
  };
}
