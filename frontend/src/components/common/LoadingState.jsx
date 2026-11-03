import React from 'react';
import { Loader2, Shield } from 'lucide-react';

export default function LoadingState({
  title = 'Loading security data...',
  message = 'Please wait while we connect to the ContainerShield API.',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative mb-4">
        <div className="p-4 bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-full text-brand-600 dark:text-brand-500 shadow-xs">
          <Shield className="w-8 h-8 animate-pulse" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 bg-brand-600 rounded-full text-white">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      </div>
      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">{message}</p>
    </div>
  );
}
