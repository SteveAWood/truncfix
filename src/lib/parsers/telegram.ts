import { ParseResult, SourceFile } from '@/types';

/**
 * Parse Telegram official export JSON.
 * Typical shape:
 *  { messages: [ { type, date, from, text, ... } ] }
 * text can be a string or an array of entities.
 */
export function parseTelegram(text: string, filename: string): ParseResult {
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
    if (m.type && m.type !== 'message') return; // skip service messages when possible

    const from = String(m.from || m.actor || 'Unknown');
    const date = String(m.date || m.date_unixtime || '');
    const content = flattenTelegramText(m.text);

    if (!content.trim()) return;

    const block = date ? `[${date}] ${from}: ${content}` : `${from}: ${content}`;
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
    detectedType: 'telegram',
  };
}

function flattenTelegramText(text: unknown): string {
  if (typeof text === 'string') return text;
  if (Array.isArray(text)) {
    return text
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as Record<string, unknown>).text || '');
        }
        return '';
      })
      .join('');
  }
  return '';
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
    detectedType: 'telegram',
  };
}
