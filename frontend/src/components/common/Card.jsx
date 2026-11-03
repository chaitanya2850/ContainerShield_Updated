import React from 'react';

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerClassName = '',
  bodyClassName = '',
}) {
  return (
    <div className={`bg-white dark:bg-dark-850 rounded-xl border border-slate-200 dark:border-dark-700/60 shadow-sm dark:shadow-lg dark:shadow-black/20 overflow-hidden transition-colors ${className}`}>
      {(title || subtitle || action) && (
        <div className={`px-5 py-4 border-b border-slate-200 dark:border-dark-700/60 flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
