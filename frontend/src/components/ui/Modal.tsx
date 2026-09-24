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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/60 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className={cn('flex flex-col bg-slate-950/90 border border-white/[0.08] rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden', widthClasses[width], className)}>
        {children}
      </div>
    </div>
  );
};
