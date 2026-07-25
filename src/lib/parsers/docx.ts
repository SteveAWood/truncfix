import { ParseResult } from '@/types';
import { parsePlainText } from './plain';

/**
 * Convert a DOCX ArrayBuffer to plain text using mammoth, then
 * reuse the plain-text / markdown block splitter.
 *
 * mammoth is loaded dynamically so the main bundle stays smaller
 * until a .docx is actually uploaded.
 */
export async function parseDocx(
  arrayBuffer: ArrayBuffer,
  filename: string
): Promise<ParseResult> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value || '';

  const parsed = parsePlainText(text, filename, 'plain');
  return {
    ...parsed,
    detectedType: 'docx',
  };
}
