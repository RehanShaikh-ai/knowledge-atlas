import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DashboardMetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  className?: string;
}

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  className
}) => {
  return (
    <div className={cn("bg-[#0c1017]/90 border border-slate-700/60 rounded-xl p-5 backdrop-blur-xl shadow-lg flex flex-col gap-2 relative overflow-hidden group", className)}>
      <div className="absolute -inset-0.5 bg-gradient-to-br from-sky-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl blur"></div>
      <div className="relative z-10 flex items-center gap-3 text-slate-400">
        {Icon && <Icon size={18} className="text-sky-400" />}
        <h3 className="text-sm font-semibold tracking-wide uppercase">{title}</h3>
      </div>
      <div className="relative z-10 mt-1">
        <span className="text-3xl font-bold text-slate-100">{value}</span>
      </div>
      {description && (
        <p className="relative z-10 text-xs text-slate-500 mt-1">{description}</p>
      )}
    </div>
  );
};
