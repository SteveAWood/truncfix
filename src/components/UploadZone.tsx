'use client';

import { useCallback, useState } from 'react';

interface Props {
  onFileLoaded: (payload: {
    content?: string;
    arrayBuffer?: ArrayBuffer;
    fileName: string;
    isBinary: boolean;
  }) => void;
  isLoading: boolean;
}

const ACCEPTED_EXTENSIONS = [
  '.xml',
  '.txt',
  '.md',
  '.markdown',
  '.log',
  '.docx',
  '.json',
];

export default function UploadZone({ onFileLoaded, isLoading }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      const lower = file.name.toLowerCase();
      const ok = ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
      if (!ok) {
        setError(
          'Supported formats: .xml (Repomix), .txt, .md, .log, .docx, and chat exports (.json / WhatsApp .txt).'
        );
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError('File is too large (max 50 MB).');
        return;
      }

      try {
        if (lower.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          onFileLoaded({
            arrayBuffer,
            fileName: file.name,
            isBinary: true,
          });
          return;
        }

        const text = await file.text();
        onFileLoaded({
          content: text,
          fileName: file.name,
          isBinary: false,
        });
      } catch {
        setError('Failed to read file.');
      }
    },
    [onFileLoaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`
        relative rounded-2xl border-2 border-dashed p-10 text-center transition-all
        ${
          isDragging
            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
            : 'border-slate-300 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600'
        }
        ${isLoading ? 'opacity-60 pointer-events-none' : ''}
      `}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-teal-600 dark:text-teal-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <div>
          <p className="text-base font-medium text-slate-800 dark:text-slate-200">
            Drop a large file here
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Repomix, Markdown, TXT, logs, DOCX, WhatsApp, Discord, Slack, Telegram
          </p>
        </div>

        <label className="mt-2">
          <input
            type="file"
            accept=".xml,.txt,.md,.markdown,.log,.docx,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
          />
          <span className="inline-flex items-center px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium cursor-pointer transition-colors">
            Choose file
          </span>
        </label>
      </div>

      {error && (
        <p className="mt-4 text-sm text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
