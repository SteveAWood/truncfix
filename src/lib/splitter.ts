import { SourceFile, SplitPart, SplitOptions } from '@/types';

/**
 * Creates the header that appears at the top of every output part.
 * Modeled after Repomix headers for familiarity.
 */
function buildPartHeader(partIndex: number, totalParts: number, filesInPart: SourceFile[], characterLimit: number): string {
  const fileList = filesInPart.map(f => `  - ${f.path} (${f.charCount.toLocaleString()} chars)`).join('\n');
  
  return `This file is part of a truncfix split package.
=== truncfix PART ${String(partIndex).padStart(2, '0')} of ${String(totalParts).padStart(2, '0')} ===
Character limit setting: ${characterLimit.toLocaleString()}
Files in this part: ${filesInPart.length}

Files contained in this part:
${fileList}

--------------------------------------------------
`;
}

/**
 * Core splitting algorithm.
 * 
 * Rules:
 * 1. Prefer packing whole source files together.
 * 2. Never split a source file across parts unless the file itself exceeds the limit
 *    AND allowExceedForLargeFiles is false.
 * 3. If allowExceedForLargeFiles is true, a single part may exceed the limit
 *    so that an oversized source file stays intact.
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
      totalParts: 0, // will be filled later
      files: [...currentFiles],
      charCount: currentChars,
      exceedsLimit: exceeds,
    });
    currentFiles = [];
    currentChars = 0;
  };

  for (const file of sourceFiles) {
    const fileSize = file.charCount;

    // Case: single file is larger than the limit
    if (fileSize > characterLimit) {
      // Flush whatever is currently buffered
      pushCurrentPart();

      if (allowExceedForLargeFiles) {
        // Keep the large file intact in its own part (allowed to exceed)
        currentFiles = [file];
        currentChars = fileSize;
        pushCurrentPart(true);
      } else {
        // Hard-split the oversized file by character count
        // (last resort – only when toggle is off)
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

    // Normal case: file fits within limit
    if (currentChars + fileSize > characterLimit && currentFiles.length > 0) {
      pushCurrentPart();
    }

    currentFiles.push(file);
    currentChars += fileSize;
  }

  // Flush remaining
  pushCurrentPart();

  // Set totalParts on every part
  const total = parts.length;
  parts.forEach(p => {
    p.totalParts = total;
  });

  return parts;
}

/**
 * Converts a SplitPart into the final XML string that will be written to disk.
 */
export function partToXml(part: SplitPart, characterLimit: number): string {
  const header = buildPartHeader(part.index, part.totalParts, part.files, characterLimit);
  
  const body = part.files.map(f => 
    `<file path="${f.path}">\n${f.content}\n</file>`
  ).join('\n\n');

  return `${header}\n<files>\n${body}\n</files>\n`;
}

/**
 * Rough estimate of final zip size in bytes.
 * XML text compresses reasonably well; we use a conservative 0.35 ratio + overhead.
 */
export function estimateZipSize(parts: SplitPart[], readmeChars: number): number {
  const totalTextChars = parts.reduce((sum, p) => sum + p.charCount, 0) + readmeChars;
  // Headers add a bit more
  const headerOverhead = parts.length * 800;
  const uncompressed = totalTextChars + headerOverhead;
  // Assume ~35-40% compression for code/XML
  return Math.round(uncompressed * 0.38);
}
