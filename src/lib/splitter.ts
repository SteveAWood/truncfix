import { SourceFile, SplitPart, SplitOptions, Batch, BatchOptions } from '@/types';
import { estimateTokens, tokensToChars } from './tokens';

/**
 * Creates the header that appears at the top of every output part.
 */
function buildPartHeader(
  partIndex: number,
  totalParts: number,
  filesInPart: SourceFile[],
  characterLimit: number,
  detectedType?: string
): string {
  const fileList = filesInPart
    .map((f) => `  - ${f.path} (${f.charCount.toLocaleString()} chars)`)
    .join('\n');

  return `This file is part of a truncfix split package.
=== truncfix PART ${String(partIndex).padStart(2, '0')} of ${String(totalParts).padStart(2, '0')} ===
Character limit setting: ${characterLimit.toLocaleString()}
Source type: ${detectedType || 'unknown'}
Blocks in this part: ${filesInPart.length}

Blocks contained in this part:
${fileList}

--------------------------------------------------
`;
}

/**
 * Core splitting algorithm.
 *
 * Rules:
 * 1. Prefer packing whole source blocks together.
 * 2. Never split a source block across parts unless the block itself exceeds the limit
 *    AND allowExceedForLargeFiles is false.
 * 3. If allowExceedForLargeFiles is true, a single part may exceed the limit
 *    so that an oversized block stays intact.
 */
export function splitFiles(
  sourceFiles: SourceFile[],
  options: SplitOptions
): SplitPart[] {
  const { characterLimit, allowExceedForLargeFiles } = options;
  const parts: SplitPart[] = [];

  let currentFiles: SourceFile[] = [];
  let currentChars = 0;

  const pushCurrentPart = (exceeds = false) => {
    if (currentFiles.length === 0) return;
    parts.push({
      index: parts.length + 1,
      totalParts: 0, // filled later
      files: [...currentFiles],
      charCount: currentChars,
      exceedsLimit: exceeds,
    });
    currentFiles = [];
    currentChars = 0;
  };

  for (const file of sourceFiles) {
    const fileSize = file.charCount;

    // Case: single block is larger than the limit
    if (fileSize > characterLimit) {
      pushCurrentPart();

      if (allowExceedForLargeFiles) {
        // Keep the large block intact in its own part
        currentFiles = [file];
        currentChars = fileSize;
        pushCurrentPart(true);
      } else {
        // Hard-split the oversized block by character count (last resort)
        let remaining = file.content;
        let chunkIndex = 0;
        while (remaining.length > 0) {
          const chunkContent = remaining.slice(0, characterLimit);
          remaining = remaining.slice(characterLimit);
          chunkIndex += 1;

          const chunkFile: SourceFile = {
            path: `${file.path} [chunk ${chunkIndex}]`,
            content: chunkContent,
            charCount: chunkContent.length,
          };
          parts.push({
            index: parts.length + 1,
            totalParts: 0,
            files: [chunkFile],
            charCount: chunkContent.length,
            exceedsLimit: false,
          });
        }
      }
      continue;
    }

    // Normal case: block fits within limit
    if (currentChars + fileSize > characterLimit && currentFiles.length > 0) {
      pushCurrentPart();
    }

    currentFiles.push(file);
    currentChars += fileSize;
  }

  pushCurrentPart();

  const total = parts.length;
  parts.forEach((p) => {
    p.totalParts = total;
  });

  return parts;
}

/**
 * Group already-created parts into batches that each stay under a token budget.
 * This lets the user keep individual conversation threads under a safe context size.
 */
export function groupIntoBatches(
  parts: SplitPart[],
  maxTokensPerZip: number
): Batch[] {
  if (parts.length === 0) return [];

  const maxChars = tokensToChars(maxTokensPerZip);
  const batches: Batch[] = [];

  let currentParts: SplitPart[] = [];
  let currentChars = 0;

  const flush = () => {
    if (currentParts.length === 0) return;
    batches.push({
      index: batches.length + 1,
      totalBatches: 0,
      parts: [...currentParts],
      totalChars: currentChars,
      estimatedTokens: estimateTokens(currentChars),
    });
    currentParts = [];
    currentChars = 0;
  };

  for (const part of parts) {
    // A single part larger than the whole budget still goes in its own batch
    if (part.charCount > maxChars) {
      flush();
      currentParts = [part];
      currentChars = part.charCount;
      flush();
      continue;
    }

    if (currentChars + part.charCount > maxChars && currentParts.length > 0) {
      flush();
    }

    currentParts.push(part);
    currentChars += part.charCount;
  }

  flush();

  const total = batches.length;
  batches.forEach((b) => {
    b.totalBatches = total;
  });

  return batches;
}

/**
 * Converts a SplitPart into the final text that will be written into the zip.
 * Extension is chosen based on content style (xml for repomix, txt otherwise).
 */
export function partToText(
  part: SplitPart,
  characterLimit: number,
  detectedType: string = 'unknown',
  extension: string = 'txt'
): string {
  const header = buildPartHeader(
    part.index,
    part.totalParts,
    part.files,
    characterLimit,
    detectedType
  );

  if (detectedType === 'repomix' || extension === 'xml') {
    const body = part.files
      .map((f) => `<file path="${f.path}">\n${f.content}\n</file>`)
      .join('\n\n');
    return `${header}\n<files>\n${body}\n</files>\n`;
  }

  // Plain / markdown / log / chat style
  const body = part.files
    .map((f) => `== ${f.path} ==\n${f.content}`)
    .join('\n\n');
  return `${header}\n${body}\n`;
}

/**
 * Rough estimate of final zip size in bytes.
 */
export function estimateZipSize(parts: SplitPart[], readmeChars: number): number {
  const totalTextChars =
    parts.reduce((sum, p) => sum + p.charCount, 0) + readmeChars;
  const headerOverhead = parts.length * 800;
  const uncompressed = totalTextChars + headerOverhead;
  return Math.round(uncompressed * 0.38);
}

// Keep old name working for any remaining imports during transition
export const partToXml = (part: SplitPart, characterLimit: number) =>
  partToText(part, characterLimit, 'repomix', 'xml');
