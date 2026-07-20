'use client';

import { RiskInfo } from '@/types';

interface Props {
  risk: RiskInfo;
}

export default function RiskBadge({ risk }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${risk.colorClass}`}
      >
        {risk.label}
      </span>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {risk.description}
      </p>
    </div>
  );
}
