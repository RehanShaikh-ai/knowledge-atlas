import React from 'react';
import { ApiError } from '@/types/api';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  error: ApiError | string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, className = '' }) => {
  const message = typeof error === 'string' ? error : error.error.message;
  const code = typeof error === 'string' ? undefined : error.error.code;

  return (
    <div data-testid="error-state" className={`p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl flex items-start gap-3 ${className}`}>
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
      <div>
        <span className="block text-sm font-medium">
          {code && <span className="font-bold mr-1">[{code}] </span>}
          {message}
        </span>
      </div>
    </div>
  );
};
