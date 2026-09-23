import React from 'react';
import { Ghost } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  subMessage?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No records found.',
  subMessage,
  icon,
  className = ''
}) => {
  return (
    <div data-testid="empty-state" className={`flex flex-col items-center justify-center p-8 text-center bg-base border border-surface1 border-dashed rounded-xl text-overlay1 ${className}`}>
      {icon ? (
        <div className="mb-4 opacity-50">{icon}</div>
      ) : (
        <Ghost size={32} className="mb-4 opacity-30" />
      )}
      <p className="text-sm font-semibold text-text">{message}</p>
      {subMessage && (
        <p className="text-xs mt-1 text-overlay0 max-w-sm mx-auto">{subMessage}</p>
      )}
    </div>
  );
};
