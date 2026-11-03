import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Failed to Load Data',
  message = 'An unexpected error occurred while communicating with the ContainerShield backend.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl flex flex-col items-center text-center ${className}`}>
      <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-full text-rose-600 dark:text-rose-400 mb-3">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-rose-900 dark:text-rose-200 mb-1">{title}</h4>
      <p className="text-sm text-rose-700 dark:text-rose-300/80 max-w-lg mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
