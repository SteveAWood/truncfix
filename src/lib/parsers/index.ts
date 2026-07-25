import { FileType, ParseResult } from '@/types';
import { detectFileType } from '../detect';
import { parseRepomix } from './repomix';
import { parsePlainText } from './plain';

/**
 * Main entry point. Detects type and dispatches to the correct parser.
 * Always returns a ParseResult so the rest of the pipeline stays uniform.
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

    // Phase 2+ placeholders – fall back to plain text for now
    case 'whatsapp':
    case 'discord':
    case 'slack':
    case 'telegram':
    case 'imessage':
    case 'docx':
    case 'unknown':
    default:
      // For now treat unknown / not-yet-implemented as plain text
      // so the user still gets a usable split.
      return {
        ...parsePlainText(content, filename, 'plain'),
        detectedType: detected,
      };
  }
}

export type { FileType, ParseResult };
