import { RiskLevel, RiskInfo } from '@/types';

/**
 * Returns risk assessment for a given character limit.
 * Based on real truncation experiments conducted in July 2026.
 */
export function getRiskInfo(limit: number): RiskInfo {
  if (limit <= 45000) {
    return {
      level: 'very-low',
      label: 'Very Low Risk',
      description: 'Highest reliability. Recommended for critical or irreplaceable files.',
      colorClass: 'bg-emerald-500 text-white',
    };
  }
  if (limit <= 60000) {
    return {
      level: 'low',
      label: 'Low Risk',
      description: 'Recommended default. Strong reliability for most use cases.',
      colorClass: 'bg-emerald-500 text-white',
    };
  }
  if (limit <= 90000) {
    return {
      level: 'medium',
      label: 'Medium Risk',
      description: 'Usually works, but truncation has been observed in this range.',
      colorClass: 'bg-amber-500 text-white',
    };
  }
  if (limit <= 120000) {
    return {
      level: 'high',
      label: 'High Risk',
      description: 'Significant chance of truncation. Use only if fewer parts are critical.',
      colorClass: 'bg-rose-500 text-white',
    };
  }
  return {
    level: 'very-high',
    label: 'Very High Risk',
    description: 'Not recommended. High probability of severe truncation.',
    colorClass: 'bg-rose-700 text-white',
  };
}

export function getRiskLevel(limit: number): RiskLevel {
  return getRiskInfo(limit).level;
}
