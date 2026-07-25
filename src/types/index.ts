export interface SourceFile {
  path: string;
  content: string;
  charCount: number;
}

export interface SplitPart {
  index: number;
  totalParts: number;
  files: SourceFile[];
  charCount: number;
  exceedsLimit: boolean;
}

export interface ParseResult {
  files: SourceFile[];
  totalChars: number;
  fileCount: number;
  detectedType: FileType;
}

export interface SplitOptions {
  characterLimit: number;
  allowExceedForLargeFiles: boolean;
}

export interface BatchOptions extends SplitOptions {
  maxTokensPerZip: number;
}

export interface Batch {
  index: number;
  totalBatches: number;
  parts: SplitPart[];
  totalChars: number;
  estimatedTokens: number;
}

export type FileType =
  | 'repomix'
  | 'plain'
  | 'markdown'
  | 'log'
  | 'docx'
  | 'whatsapp'
  | 'discord'
  | 'slack'
  | 'telegram'
  | 'imessage'
  | 'unknown';

export type RiskLevel = 'very-low' | 'low' | 'medium' | 'high' | 'very-high';

export interface RiskInfo {
  level: RiskLevel;
  label: string;
  description: string;
  colorClass: string;
}

export interface UsageLog {
  timestamp: string;
  event: 'upload' | 'split' | 'download';
  originalChars?: number;
  originalFiles?: number;
  characterLimit?: number;
  maxTokensPerZip?: number;
  allowExceed?: boolean;
  partsCreated?: number;
  batchesCreated?: number;
  estimatedTokens?: number;
  zipSizeEstimate?: number;
  detectedType?: FileType;
  userAgent?: string;
}
