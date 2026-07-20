'use client';

import { useMemo, useState } from 'react';
import Header from '@/components/Header';
import UploadZone from '@/components/UploadZone';
import LimitSlider from '@/components/LimitSlider';
import StatsPanel from '@/components/StatsPanel';
import { parseRepomixXml } from '@/lib/parser';
import { splitFiles, estimateZipSize } from '@/lib/splitter';
import { createZipBlob } from '@/lib/zip';
import { logUsage } from '@/lib/logger';
import { ParseResult } from '@/types';

export default function HomePage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [characterLimit, setCharacterLimit] = useState(55000);
  const [allowExceed, setAllowExceed] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ready' | 'splitting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileLoaded = (content: string, name: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setStatus('idle');

    try {
      const result = parseRepomixXml(content);

      if (result.fileCount === 0) {
        setErrorMsg('No <file path="..."> blocks found. Is this a valid Repomix XML file?');
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

    const readmeChars = 1200;
    const zipBytes = estimateZipSize(parts, readmeChars);
    const hasOversized = parseResult.files.some(f => f.charCount > characterLimit);

    return {
      parts,
      estimatedParts: parts.length,
      estimatedZipBytes: zipBytes,
      hasOversizedFiles: hasOversized,
    };
  }, [parseResult, characterLimit, allowExceed]);

  const handleSplitAndDownload = async () => {
    if (!parseResult || !estimate) return;

    setStatus('splitting');
    setErrorMsg(null);

    try {
      const blob = await createZipBlob(
        estimate.parts,
        characterLimit,
        parseResult.fileCount,
        parseResult.totalChars,
        allowExceed
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `truncfix-${fileName?.replace(/\\.xml$/i, '') || 'split'}.zip`;
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
        allowExceed,
        partsCreated: estimate.parts.length,
        zipSizeEstimate: estimate.estimatedZipBytes,
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
            Stop losing code to truncation
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-lg">
            Upload a large Repomix file. Choose a safe character limit. Download a clean zip of perfectly sized parts.
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
              totalChars={parseResult.totalChars}
              fileCount={parseResult.fileCount}
              estimatedParts={estimate.estimatedParts}
              estimatedZipBytes={estimate.estimatedZipBytes}
              hasOversizedFiles={estimate.hasOversizedFiles}
            />

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <LimitSlider
                value={characterLimit}
                onChange={setCharacterLimit}
                allowExceed={allowExceed}
                onAllowExceedChange={setAllowExceed}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {status === 'done'
                  ? 'Zip downloaded successfully.'
                  : `Ready to create ${estimate.estimatedParts} part${estimate.estimatedParts === 1 ? '' : 's'}.`}
              </p>

              <button
                onClick={handleSplitAndDownload}
                disabled={status === 'splitting'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold shadow-sm transition-colors"
              >
                {status === 'splitting' ? 'Creating zip…' : `Download Zip (${estimate.estimatedParts} parts)`}
              </button>
            </div>
          </>
        )}

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 pt-8">
          truncfix runs entirely in your browser. Files are never uploaded to a server for processing.
          Only anonymous usage metrics are logged.
        </p>
      </main>
    </div>
  );
}
