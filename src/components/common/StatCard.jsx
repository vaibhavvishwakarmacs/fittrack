import React from 'react';
import { cn } from '../../lib/utils';

export const StatCard = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  iconBg = 'bg-white/5 text-lime',
  trend,
  progress,
  action,
  children,
  onClick,
  className,
}) => {
  const percentage = progress && progress.target > 0
    ? Math.min(Math.round((progress.current / progress.target) * 100), 100)
    : 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl p-3.5 sm:p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/15 transition-all duration-200 relative overflow-hidden text-left active:scale-[0.98] select-none',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase truncate">
          {title}
        </span>
        {icon && (
          <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-white font-sans tracking-tight">
          {value}
        </span>
        {unit && <span className="text-[11px] font-semibold text-slate-400">{unit}</span>}
      </div>

      {subtitle && (
        <p className="text-[10px] text-slate-400 truncate mt-0.5">{subtitle}</p>
      )}

      {progress && (
        <div className="mt-2.5">
          <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', progress.color || 'bg-lime')}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium mt-1">
            <span>{percentage}%</span>
            <span>Goal: {progress.target.toLocaleString()}</span>
          </div>
        </div>
      )}

      {action && <div className="mt-2.5 pt-2 border-t border-white/5">{action}</div>}
      {children}
    </div>
  );
};
