'use client';

interface Props {
  fileName: string | null;
  detectedType: string;
  totalChars: number;
  fileCount: number;
  estimatedParts: number;
  estimatedBatches: number;
  estimatedTokens: number;
  estimatedZipBytes: number;
  hasOversizedFiles: boolean;
  maxTokensPerZip: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function StatsPanel({
  fileName,
  detectedType,
  totalChars,
  fileCount,
  estimatedParts,
  estimatedBatches,
  estimatedTokens,
  estimatedZipBytes,
  hasOversizedFiles,
  maxTokensPerZip,
}: Props) {
  if (!fileName) return null;

  const overBudget = estimatedTokens > maxTokensPerZip;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
        File Analysis
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Detected type</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">
            {detectedType}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Blocks / files</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {fileCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total characters</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {totalChars.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Est. tokens (output)</p>
          <p
            className={`text-xl font-bold tabular-nums ${
              overBudget
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-teal-600 dark:text-teal-400'
            }`}
          >
            ~{estimatedTokens.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Parts</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {estimatedParts}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Batches (zips)</p>
          <p className="text-xl font-bold text-teal-600 dark:text-teal-400 tabular-nums">
            {estimatedBatches}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Est. zip size: {formatBytes(estimatedZipBytes)} · Token estimate is approximate (chars ÷ 4)
      </p>

      {overBudget && estimatedBatches > 1 && (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-3 py-2">
          Output exceeds your max tokens per zip ({maxTokensPerZip.toLocaleString()}).
          It will be packaged into <strong>{estimatedBatches} batches</strong> so each
          conversation thread stays within budget.
        </p>
      )}

      {hasOversizedFiles && (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-3 py-2">
          Some individual blocks exceed the current character limit. Enable “Allow one
          part to exceed limit” to keep them intact.
        </p>
      )}

      <p className="mt-3 text-xs text-slate-400 truncate">Loaded: {fileName}</p>
    </div>
  );
}
