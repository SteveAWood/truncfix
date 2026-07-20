'use client';

import { getRiskInfo } from '@/lib/risk';
import RiskBadge from './RiskBadge';

interface Props {
  value: number;
  onChange: (value: number) => void;
  allowExceed: boolean;
  onAllowExceedChange: (value: boolean) => void;
}

export default function LimitSlider({
  value,
  onChange,
  allowExceed,
  onAllowExceedChange,
}: Props) {
  const risk = getRiskInfo(value);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Character limit per part
          </label>
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 tabular-nums">
            {value.toLocaleString()}
          </span>
        </div>

        <input
          type="range"
          min={20000}
          max={150000}
          step={1000}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
        />

        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>20k</span>
          <span>60k (recommended)</span>
          <span>150k</span>
        </div>
      </div>

      <RiskBadge risk={risk} />

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
            If a single source file is larger than the limit, keep it intact in its own part
            instead of splitting it across multiple files.
          </p>
        </div>
      </label>
    </div>
  );
}
