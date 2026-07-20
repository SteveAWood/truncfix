'use client';

interface Props {
  fileName: string | null;
  totalChars: number;
  fileCount: number;
  estimatedParts: number;
  estimatedZipBytes: number;
  hasOversizedFiles: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function StatsPanel({
  fileName,
  totalChars,
  fileCount,
  estimatedParts,
  estimatedZipBytes,
  hasOversizedFiles,
}: Props) {
  if (!fileName) return null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
        File Analysis
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Source files</p>
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
          <p className="text-xs text-slate-500 dark:text-slate-400">Estimated parts</p>
          <p className="text-xl font-bold text-teal-600 dark:text-teal-400 tabular-nums">
            {estimatedParts}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Est. zip size</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {formatBytes(estimatedZipBytes)}
          </p>
        </div>
      </div>

      {hasOversizedFiles && (
        <p className="mt-4 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-3 py-2">
          Some individual source files exceed the current limit. Enable “Allow one part to exceed limit” to keep them intact.
        </p>
      )}

      <p className="mt-3 text-xs text-slate-400 truncate">
        Loaded: {fileName}
      </p>
    </div>
  );
}
