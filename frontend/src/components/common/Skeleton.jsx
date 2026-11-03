import React from 'react';

export default function Skeleton({
  className = '',
  rows = 1,
  type = 'rect',
}) {
  if (type === 'table') {
    return (
      <div className="w-full space-y-3 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-dark-800 rounded-lg w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-dark-850/60 border border-slate-200 dark:border-dark-700/40 rounded-lg w-full" />
        ))}
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-28 bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/60 rounded-xl p-4 space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-dark-700/80 rounded w-1/2" />
            <div className="h-8 bg-slate-200 dark:bg-dark-700 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-dark-700/60 rounded ${className}`} />
  );
}
