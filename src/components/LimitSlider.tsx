'use client';

import { getRiskInfo } from '@/lib/risk';
import RiskBadge from './RiskBadge';

interface Props {
  characterLimit: number;
  onCharacterLimitChange: (value: number) => void;
  maxTokensPerZip: number;
  onMaxTokensChange: (value: number) => void;
  allowExceed: boolean;
  onAllowExceedChange: (value: boolean) => void;
}

export default function LimitSlider({
  characterLimit,
  onCharacterLimitChange,
  maxTokensPerZip,
  onMaxTokensChange,
  allowExceed,
  onAllowExceedChange,
}: Props) {
  const risk = getRiskInfo(characterLimit);

  return (
    <div className="space-y-8">
      {/* Character limit (per part) */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Character limit per part
          </label>
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 tabular-nums">
            {characterLimit.toLocaleString()}
          </span>
        </div>

        <input
          type="range"
          min={20000}
          max={150000}
          step={1000}
          value={characterLimit}
          onChange={(e) => onCharacterLimitChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
        />

        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>20k</span>
          <span>55k (recommended)</span>
          <span>150k</span>
        </div>

        <div className="mt-3">
          <RiskBadge risk={risk} />
        </div>
      </div>

      {/* Max tokens per zip / batch */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Max tokens per zip (batch)
          </label>
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 tabular-nums">
            {maxTokensPerZip.toLocaleString()}
          </span>
        </div>

        <input
          type="range"
          min={50000}
          max={500000}
          step={10000}
          value={maxTokensPerZip}
          onChange={(e) => onMaxTokensChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
        />

        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>50k</span>
          <span>200k (recommended)</span>
          <span>500k</span>
        </div>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Keeps each conversation thread under this approximate token budget.
          If the full output is larger, multiple batches are created automatically.
        </p>
      </div>

      {/* Allow exceed toggle */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={allowExceed}
          onChange={(e) => onAllowExceedChange(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
        />
        <div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-teal-600 transition-colors">
            Allow one part to exceed limit
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            If a single block is larger than the character limit, keep it intact in its
            own part instead of splitting it mid-content.
          </p>
        </div>
      </label>
    </div>
  );
}
