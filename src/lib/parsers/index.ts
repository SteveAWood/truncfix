import { FileType, ParseResult } from '@/types';
import { detectFileType } from '../detect';
import { parseRepomix } from './repomix';
import { parsePlainText } from './plain';
import { parseWhatsApp } from './whatsapp';
import { parseDiscord } from './discord';
import { parseSlack } from './slack';
import { parseTelegram } from './telegram';
import { parseDocx } from './docx';

/**
 * Main entry for text-based files.
 * Detects type and dispatches to the correct parser.
 */
export function parseFile(content: string, filename: string): ParseResult {
  const detected = detectFileType(filename, content);

  switch (detected) {
    case 'repomix':
      return parseRepomix(content);

    case 'markdown':
      return parsePlainText(content, filename, 'markdown');

    case 'log':
      return parsePlainText(content, filename, 'log');

    case 'plain':
      return parsePlainText(content, filename, 'plain');

    case 'whatsapp':
      return parseWhatsApp(content, filename);

    case 'discord':
      return parseDiscord(content, filename);

    case 'slack':
      return parseSlack(content, filename);

    case 'telegram':
      return parseTelegram(content, filename);

    case 'imessage':
      // Best-effort: treat as plain text for now
      return {
        ...parsePlainText(content, filename, 'plain'),
        detectedType: 'imessage',
      };

    case 'docx':
    case 'unknown':
    default:
      return {
        ...parsePlainText(content, filename, 'plain'),
        detectedType: detected,
      };
  }
}

/**
 * Async entry for binary formats (DOCX).
 */
export async function parseBinaryFile(
  arrayBuffer: ArrayBuffer,
  filename: string
): Promise<ParseResult> {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.docx')) {
    return parseDocx(arrayBuffer, filename);
  }
  // Fallback: decode as text
  const text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
  return parseFile(text, filename);
}

export type { FileType, ParseResult };
