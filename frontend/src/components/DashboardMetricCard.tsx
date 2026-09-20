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
    <div className={cn("dashboard-card p-5 flex flex-col gap-2 relative overflow-hidden group", className)}>
      <div className="absolute -inset-0.5 bg-gradient-to-br from-[var(--blue)]/10 to-[var(--mauve)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl blur pointer-events-none"></div>
      <div className="relative z-10 flex items-center gap-3 text-slate-400">
        {Icon && <Icon size={18} className="text-sky-400" />}
        <h3 className="dashboard-metric-label">{title}</h3>
      </div>
      <div className="relative z-10 mt-1">
        <span className="dashboard-metric-value">{value}</span>
      </div>
      {description && (
        <p className="relative z-10 text-xs text-slate-500 mt-1">{description}</p>
      )}
    </div>
  );
};
