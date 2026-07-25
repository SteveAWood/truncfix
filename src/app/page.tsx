'use client';

import { useMemo, useState } from 'react';
import Header from '@/components/Header';
import UploadZone from '@/components/UploadZone';
import LimitSlider from '@/components/LimitSlider';
import StatsPanel from '@/components/StatsPanel';
import { parseFile } from '@/lib/parsers';
import { splitFiles, groupIntoBatches, estimateZipSize } from '@/lib/splitter';
import { createBatchedZipBlob } from '@/lib/zip';
import { estimateTokens } from '@/lib/tokens';
import { logUsage } from '@/lib/logger';
import { ParseResult } from '@/types';

export default function HomePage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [characterLimit, setCharacterLimit] = useState(55000);
  const [maxTokensPerZip, setMaxTokensPerZip] = useState(200000);
  const [allowExceed, setAllowExceed] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<
    'idle' | 'ready' | 'splitting' | 'done' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileLoaded = (content: string, name: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setStatus('idle');

    try {
      const result = parseFile(content, name);

      if (result.fileCount === 0) {
        setErrorMsg(
          'Could not extract any content blocks from this file. Try a different format.'
        );
        setParseResult(null);
        setFileName(null);
        setStatus('error');
        return;
      }

      setFileName(name);
      setParseResult(result);
      setStatus('ready');

      logUsage({
        timestamp: new Date().toISOString(),
        event: 'upload',
        originalChars: result.totalChars,
        originalFiles: result.fileCount,
        detectedType: result.detectedType,
      });
    } catch {
      setErrorMsg('Failed to parse file.');
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const estimate = useMemo(() => {
    if (!parseResult) return null;

    const parts = splitFiles(parseResult.files, {
      characterLimit,
      allowExceedForLargeFiles: allowExceed,
    });

    const batches = groupIntoBatches(parts, maxTokensPerZip);
    const totalChars = parseResult.totalChars;
    const estimatedTokens = estimateTokens(totalChars);
    const readmeChars = 2000 + batches.length * 800;
    const zipBytes = estimateZipSize(parts, readmeChars);
    const hasOversized = parseResult.files.some(
      (f) => f.charCount > characterLimit
    );

    return {
      parts,
      batches,
      estimatedParts: parts.length,
      estimatedBatches: batches.length,
      estimatedTokens,
      estimatedZipBytes: zipBytes,
      hasOversizedFiles: hasOversized,
    };
  }, [parseResult, characterLimit, maxTokensPerZip, allowExceed]);

  const handleSplitAndDownload = async () => {
    if (!parseResult || !estimate || !fileName) return;

    setStatus('splitting');
    setErrorMsg(null);

    try {
      const blob = await createBatchedZipBlob(
        estimate.batches,
        characterLimit,
        maxTokensPerZip,
        parseResult.fileCount,
        parseResult.totalChars,
        allowExceed,
        parseResult.detectedType,
        fileName
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const base = fileName.replace(/\.[^.]+$/i, '');
      a.download = `truncfix-${base}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('done');

      logUsage({
        timestamp: new Date().toISOString(),
        event: 'download',
        originalChars: parseResult.totalChars,
        originalFiles: parseResult.fileCount,
        characterLimit,
        maxTokensPerZip,
        allowExceed,
        partsCreated: estimate.parts.length,
        batchesCreated: estimate.batches.length,
        estimatedTokens: estimate.estimatedTokens,
        zipSizeEstimate: estimate.estimatedZipBytes,
        detectedType: parseResult.detectedType,
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create zip. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Stop losing context to truncation
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-lg">
            Upload large code dumps, documents, or chat logs. Choose safe size limits.
            Download clean, batch-ready parts for AI conversations.
          </p>
        </div>

        <UploadZone onFileLoaded={handleFileLoaded} isLoading={isProcessing} />

        {errorMsg && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 px-4 py-3 text-sm">
            {errorMsg}
          </div>
        )}

        {parseResult && estimate && (
          <>
            <StatsPanel
              fileName={fileName}
              detectedType={parseResult.detectedType}
              totalChars={parseResult.totalChars}
              fileCount={parseResult.fileCount}
              estimatedParts={estimate.estimatedParts}
              estimatedBatches={estimate.estimatedBatches}
              estimatedTokens={estimate.estimatedTokens}
              estimatedZipBytes={estimate.estimatedZipBytes}
              hasOversizedFiles={estimate.hasOversizedFiles}
              maxTokensPerZip={maxTokensPerZip}
            />

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <LimitSlider
                characterLimit={characterLimit}
                onCharacterLimitChange={setCharacterLimit}
                maxTokensPerZip={maxTokensPerZip}
                onMaxTokensChange={setMaxTokensPerZip}
                allowExceed={allowExceed}
                onAllowExceedChange={setAllowExceed}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {status === 'done'
                  ? 'Zip downloaded successfully.'
                  : `Ready: ${estimate.estimatedParts} part${
                      estimate.estimatedParts === 1 ? '' : 's'
                    } in ${estimate.estimatedBatches} batch${
                      estimate.estimatedBatches === 1 ? '' : 'es'
                    } (~${estimate.estimatedTokens.toLocaleString()} tokens).`}
              </p>

              <button
                onClick={handleSplitAndDownload}
                disabled={status === 'splitting'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold shadow-sm transition-colors"
              >
                {status === 'splitting'
                  ? 'Creating zip…'
                  : `Download Zip (${estimate.estimatedBatches} batch${
                      estimate.estimatedBatches === 1 ? '' : 'es'
                    })`}
              </button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 pt-8">
          truncfix runs entirely in your browser. Files are never uploaded to a server
          for processing. Only anonymous usage metrics are logged.
        </p>
      </main>
    </div>
  );
}
