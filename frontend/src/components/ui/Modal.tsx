import React from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  width = 'md'
}) => {
  if (!isOpen) return null;

  const widthClasses = {
    sm: 'w-[400px]',
    md: 'w-[600px]',
    lg: 'w-[800px]',
    xl: 'w-[1000px]',
    full: 'w-full max-w-[95vw]'
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-base/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className={cn('flex flex-col bg-crust border border-surface1 rounded-2xl shadow-2xl overflow-hidden', widthClasses[width], className)}>
        {children}
      </div>
    </div>
  );
};
