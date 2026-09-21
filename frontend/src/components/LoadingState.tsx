import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  className = ''
}) => {
  return (
    <div data-testid="loading-state" className={`flex flex-col items-center justify-center p-8 text-overlay1 ${className}`}>
      <Loader2 size={24} className="animate-spin text-blue-400 mb-3" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
