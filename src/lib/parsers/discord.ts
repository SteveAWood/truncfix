import { ParseResult, SourceFile } from '@/types';

/**
 * Parse Discord chat export JSON.
 * Supports common shapes:
 *  - { messages: [ { author: {name}, content, timestamp } ] }
 *  - { channel: {...}, messages: [...] }
 *  - raw array of messages
 */
export function parseDiscord(text: string, filename: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    // Not valid JSON – fall back to treating as plain text lines
    return plainFallback(text, filename, 'discord');
  }

  const messages = extractMessages(data);
  if (messages.length === 0) {
    return plainFallback(text, filename, 'discord');
  }

  const files: SourceFile[] = messages.map((msg, i) => {
    const author = msg.author || 'Unknown';
    const ts = msg.timestamp || '';
    const content = msg.content || '';
    const block = ts
      ? `[${ts}] ${author}: ${content}`
      : `${author}: ${content}`;

    return {
      path: `${filename} :: msg-${String(i + 1).padStart(4, '0')}`,
      content: block,
      charCount: block.length,
    };
  });

  return {
    files,
    totalChars: files.reduce((s, f) => s + f.charCount, 0),
    fileCount: files.length,
    detectedType: 'discord',
  };
}

interface NormalizedMsg {
  author: string;
  content: string;
  timestamp: string;
}

function extractMessages(data: unknown): NormalizedMsg[] {
  let list: unknown[] = [];

  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.messages)) list = obj.messages;
    else if (Array.isArray(obj.Messages)) list = obj.Messages;
  }

  const out: NormalizedMsg[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const m = item as Record<string, unknown>;

    let author = 'Unknown';
    if (typeof m.author === 'string') author = m.author;
    else if (m.author && typeof m.author === 'object') {
      const a = m.author as Record<string, unknown>;
      author = String(a.username || a.name || a.global_name || 'Unknown');
    } else if (typeof m.username === 'string') {
      author = m.username;
    }

    const content = String(m.content || m.message || '');
    const timestamp = String(m.timestamp || m.Timestamp || m.date || '');

    if (content.trim() || timestamp) {
      out.push({ author, content, timestamp });
    }
  }
  return out;
}

function plainFallback(text: string, filename: string, type: 'discord'): ParseResult {
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
    detectedType: type,
  };
}
