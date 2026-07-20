import { ParseResult, SourceFile } from '@/types';

/**
 * Parses a Repomix-style XML string into individual source files.
 * Looks for <file path="...">...</file> blocks.
 */
export function parseRepomixXml(xml: string): ParseResult {
  const files: SourceFile[] = [];
  
  // Match <file path="..."> ... </file> (non-greedy, across newlines)
  const fileRegex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;
  
  let match: RegExpExecArray | null;
  while ((match = fileRegex.exec(xml)) !== null) {
    const path = match[1];
    const content = match[2];
    files.push({
      path,
      content,
      charCount: content.length,
    });
  }

  const totalChars = files.reduce((sum, f) => sum + f.charCount, 0);

  return {
    files,
    totalChars,
    fileCount: files.length,
  };
}

/**
 * Quick character count without full parse (for very large files).
 * Falls back to full parse if needed.
 */
export function quickCharCount(text: string): number {
  return text.length;
}
