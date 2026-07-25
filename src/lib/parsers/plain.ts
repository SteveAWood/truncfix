import { ParseResult, SourceFile } from '@/types';

/**
 * Split plain text / markdown / log content into logical blocks.
 *
 * Strategy:
 * 1. Prefer splitting on markdown headings (# ## ###)
 * 2. Fall back to blank-line paragraph boundaries
 * 3. Fall back to fixed-size chunks only if a single block is enormous
 *    (the splitter + allowExceed flag will still respect the user's preference)
 */
export function parsePlainText(
  text: string,
  filename: string,
  detectedType: 'plain' | 'markdown' | 'log' = 'plain'
): ParseResult {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = splitIntoBlocks(normalized, detectedType);

  const files: SourceFile[] = blocks.map((block, i) => {
    const label =
      detectedType === 'markdown'
        ? extractHeadingLabel(block) || `section-${String(i + 1).padStart(3, '0')}`
        : `block-${String(i + 1).padStart(3, '0')}`;

    return {
      path: `${filename} :: ${label}`,
      content: block,
      charCount: block.length,
    };
  });

  // If we somehow produced zero blocks, treat the whole file as one
  if (files.length === 0 && text.length > 0) {
    files.push({
      path: filename,
      content: text,
      charCount: text.length,
    });
  }

  const totalChars = files.reduce((sum, f) => sum + f.charCount, 0);

  return {
    files,
    totalChars,
    fileCount: files.length,
    detectedType,
  };
}

function splitIntoBlocks(text: string, type: 'plain' | 'markdown' | 'log'): string[] {
  if (!text.trim()) return [];

  // Markdown: split before headings
  if (type === 'markdown') {
    const headingSplit = text.split(/(?=^#{1,6}\s+)/m).map((s) => s.trim()).filter(Boolean);
    if (headingSplit.length > 1) return headingSplit;
  }

  // Logs / plain: prefer blank-line separated paragraphs
  const paragraphs = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;

  // Single giant block – return as one piece (splitter will handle exceed logic)
  return [text.trim()];
}

function extractHeadingLabel(block: string): string | null {
  const match = block.match(/^#{1,6}\s+(.+)$/m);
  if (!match) return null;
  // Sanitize for use in a path-like label
  return match[1]
    .trim()
    .replace(/[^\w\s\-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)
    .toLowerCase();
}
