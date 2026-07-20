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
}

export interface SplitOptions {
  characterLimit: number;
  allowExceedForLargeFiles: boolean;
}

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
  allowExceed?: boolean;
  partsCreated?: number;
  zipSizeEstimate?: number;
  userAgent?: string;
  // IP will be captured server-side
}
