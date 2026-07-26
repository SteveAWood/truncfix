import { ParseResult, SourceFile } from '@/types';

/** Blocks shorter than this are merged into the previous block (unless separators). */
const MIN_BLOCK_CHARS = 500;

/**
 * Characters treated as pure separators when a block contains only these
 * (plus whitespace). Such blocks force a section boundary and are not
 * emitted as their own output blocks.
 */
const SPECIAL_ONLY_RE = /^[\s\-_=+*~#@!$%^&()[\]{}|\\/<>.,;:'"`?]+$/;

/**
 * Split plain text / markdown / log content into logical blocks.
 *
 * Strategy:
 * 1. Prefer splitting on markdown headings (# ## ###)
 * 2. Fall back to blank-line paragraph boundaries
 * 3. Merge short blocks (< 500 chars) into the previous block
 * 4. Pure special-character blocks act as hard separators (not emitted)
 */
export function parsePlainText(
  text: string,
  filename: string,
  detectedType: 'plain' | 'markdown' | 'log' = 'plain'
): ParseResult {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawBlocks = splitIntoBlocks(normalized, detectedType);
  const blocks = mergeShortBlocks(rawBlocks, MIN_BLOCK_CHARS);

  const files: SourceFile[] = blocks.map((block, i) => {
    const label =
      detectedType === 'markdown'
        ? extractHeadingLabel(block) ||
          `section-${String(i + 1).padStart(3, '0')}`
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

function splitIntoBlocks(
  text: string,
  type: 'plain' | 'markdown' | 'log'
): string[] {
  if (!text.trim()) return [];

  // Markdown: split before headings
  if (type === 'markdown') {
    const headingSplit = text
      .split(/(?=^#{1,6}\s+)/m)
      .map((s) => s.trim())
      .filter(Boolean);
    if (headingSplit.length > 1) return headingSplit;
  }

  // Prefer blank-line separated paragraphs (common after DOCX extraction)
  const paragraphs = text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;

  // Single-newline heavy docs (also common from Word): split on single newlines
  // only when there are many short lines, then let mergeShortBlocks reassemble.
  const lines = text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length > 5) return lines;

  return [text.trim()];
}

/**
 * Merge undersized blocks into the previous one.
 * Pure special-character blocks act as hard boundaries and are dropped.
 */
function mergeShortBlocks(blocks: string[], minChars: number): string[] {
  if (blocks.length === 0) return [];

  const result: string[] = [];

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;

    // Separator-only block: force a boundary, do not emit it
    if (isSpecialOnly(block)) {
      // Just skip — the next real content starts a new block
      // (we don't merge across this point because we never append to a
      //  "pending" buffer; the next non-special block is pushed fresh
      //  only if result is empty or the next block is large enough...)
      //
      // To truly prevent merging across separators, mark a hard break:
      // push an empty sentinel that the next merge won't join across.
      result.push('\0SEP\0');
      continue;
    }

    if (result.length === 0) {
      result.push(block);
      continue;
    }

    const prev = result[result.length - 1];

    // Don't merge onto a separator sentinel — replace sentinel with this block
    if (prev === '\0SEP\0') {
      result[result.length - 1] = block;
      continue;
    }

    // Merge short blocks into previous
    if (block.length < minChars) {
      result[result.length - 1] = `${prev}\n\n${block}`;
    } else {
      result.push(block);
    }
  }

  // Strip any trailing sentinel
  return result.filter((b) => b !== '\0SEP\0');
}

function isSpecialOnly(block: string): boolean {
  return SPECIAL_ONLY_RE.test(block);
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
