import { ParseResult, SourceFile } from '@/types';

/**
 * Parse WhatsApp chat export (.txt).
 *
 * Common formats:
 *   [DD/MM/YYYY, HH:MM:SS] Name: message
 *   [DD/MM/YYYY, HH:MM:SS AM/PM] Name: message
 *   DD/MM/YYYY, HH:MM - Name: message
 *
 * Each message becomes its own block so the splitter can pack whole messages.
 */
export function parseWhatsApp(text: string, filename: string): ParseResult {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  // Match start of a new message
  const msgStart =
    /^(\[\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?\]\s*[^:]+:\s*)|^(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4},\s*\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?\s*-\s*[^:]+:\s*)/;

  const messages: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (msgStart.test(line) && current.length > 0) {
      messages.push(current.join('\n').trim());
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    const joined = current.join('\n').trim();
    if (joined) messages.push(joined);
  }

  // Fallback: if we couldn't find message boundaries, treat as plain paragraphs
  if (messages.length <= 1 && normalized.trim().length > 0) {
    const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    return blocksToResult(paragraphs.length > 1 ? paragraphs : [normalized.trim()], filename);
  }

  return blocksToResult(messages, filename);
}

function blocksToResult(blocks: string[], filename: string): ParseResult {
  const files: SourceFile[] = blocks.map((block, i) => ({
    path: `${filename} :: msg-${String(i + 1).padStart(4, '0')}`,
    content: block,
    charCount: block.length,
  }));

  return {
    files,
    totalChars: files.reduce((s, f) => s + f.charCount, 0),
    fileCount: files.length,
    detectedType: 'whatsapp',
  };
}
