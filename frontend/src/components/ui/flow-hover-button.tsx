import React from 'react';
import { cn } from '@/lib/utils';

export interface FlowHoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<FlowHoverButtonProps> = ({ icon, children, className, ...props }) => (
  <button
    className={cn(
      `relative cursor-pointer z-0 flex items-center justify-center gap-2 overflow-hidden rounded-lg 
    border border-sky-500/40 bg-slate-900/85 backdrop-blur-md
    px-4 py-2 font-medium text-slate-100 transition-all duration-500 shadow-[0_0_12px_rgba(56,189,248,0.15)]
    before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5]
    before:rounded-[100%] before:bg-gradient-to-r before:from-sky-400 before:to-indigo-400 before:transition-transform before:duration-700 before:content-[""]
    hover:scale-[1.03] hover:text-slate-950 hover:font-semibold hover:border-sky-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.45)] hover:before:translate-x-[0%] hover:before:translate-y-[0%] active:scale-95 disabled:opacity-50 disabled:pointer-events-none`,
      className
    )}
    {...props}
  >
    {icon}
    {children !== undefined && <span>{children}</span>}
  </button>
);

export const FlowHoverButton = Button;
export default Button;
