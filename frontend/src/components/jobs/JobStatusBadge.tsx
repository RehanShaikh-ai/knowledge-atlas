import React from 'react';
import { JobStatus } from '@/types/jobs';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'queued':
        return {
          icon: <Clock size={12} />,
          text: 'Queued',
          classes: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        };
      case 'running':
        return {
          icon: <Loader2 size={12} className="animate-spin" />,
          text: 'Running',
          classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        };
      case 'completed':
        return {
          icon: <CheckCircle size={12} />,
          text: 'Completed',
          classes: 'bg-teal-500/10 text-teal-400 border-teal-500/20'
        };
      case 'failed':
        return {
          icon: <XCircle size={12} />,
          text: 'Failed',
          classes: 'bg-red-500/10 text-red-400 border-red-500/20'
        };
      default:
        return {
          icon: <Clock size={12} />,
          text: status,
          classes: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-wider font-semibold ${config.classes} ${className}`}>
      {config.icon}
      {config.text}
    </span>
  );
};
