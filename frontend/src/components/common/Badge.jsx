import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info, HelpCircle } from 'lucide-react';

export default function Badge({
  severity,
  text,
  variant = 'severity',
  size = 'md',
  showIcon = true,
  className = ''
}) {
  if (variant === 'severity' || severity) {
    const sev = (severity || text || '').toUpperCase();

    const config = {
      CRITICAL: {
        bg: 'bg-rose-100 dark:bg-rose-950/60',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-300 dark:border-rose-800/50',
        icon: AlertOctagon,
        label: 'CRITICAL',
      },
      HIGH: {
        bg: 'bg-orange-100 dark:bg-orange-950/60',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-300 dark:border-orange-800/50',
        icon: AlertTriangle,
        label: 'HIGH',
      },
      MEDIUM: {
        bg: 'bg-amber-100 dark:bg-amber-950/60',
        text: 'text-amber-800 dark:text-amber-400',
        border: 'border-amber-300 dark:border-amber-800/50',
        icon: AlertCircle,
        label: 'MEDIUM',
      },
      LOW: {
        bg: 'bg-emerald-100 dark:bg-emerald-950/60',
        text: 'text-emerald-800 dark:text-emerald-400',
        border: 'border-emerald-300 dark:border-emerald-800/50',
        icon: Info,
        label: 'LOW',
      },
      UNKNOWN: {
        bg: 'bg-slate-100 dark:bg-slate-900',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-300 dark:border-slate-700',
        icon: HelpCircle,
        label: 'UNKNOWN',
      },
    };

    const current = config[sev] || config.UNKNOWN;
    const IconComponent = current.icon;

    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

    return (
      <span
        className={`inline-flex items-center font-mono font-semibold rounded-md border ${current.bg} ${current.text} ${current.border} ${sizeClasses} ${className}`}
      >
        {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
        <span>{text || current.label}</span>
      </span>
    );
  }

  // Generic badge variant
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-dark-700 ${className}`}>
      {text}
    </span>
  );
}
