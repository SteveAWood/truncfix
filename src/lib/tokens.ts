/**
 * Rough token estimate used across truncfix.
 * Standard approximation for mixed English + code: ~4 characters per token.
 * This is intentionally simple and labeled as approximate in the UI.
 */
export function estimateTokens(charCount: number): number {
  if (charCount <= 0) return 0;
  return Math.ceil(charCount / 4);
}

/**
 * Convert a token budget back into an approximate character budget.
 * Useful when grouping parts into batches.
 */
export function tokensToChars(tokenCount: number): number {
  return tokenCount * 4;
}
