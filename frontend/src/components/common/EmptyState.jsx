import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function EmptyState({
  icon: Icon = ShieldAlert,
  title = 'No Data Found',
  description = 'There are no items to display at this time.',
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-dark-850/50 border border-dashed border-slate-300 dark:border-dark-700 rounded-xl ${className}`}>
      <div className="p-3 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-full text-slate-500 dark:text-slate-400 mb-4 shadow-xs">
        <Icon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
      </div>
      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
