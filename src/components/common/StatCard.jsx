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
        'glass-card rounded-2xl p-4 sm:p-5 transition-all duration-200 relative overflow-hidden text-left',
        onClick && 'cursor-pointer hover:border-lime/30 hover:scale-[1.01] active:scale-[0.99]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <span className="text-xs font-medium text-slate-400 tracking-wider uppercase truncate">
          {title}
        </span>
        {icon && (
          <div className={cn('p-2 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </div>

      {(subtitle || trend) && (
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-md font-semibold text-[10px] ml-auto',
                trend.isPositive ? 'bg-lime/10 text-lime' : 'bg-rose-500/10 text-rose-400'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}

      {progress && (
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
            <span>{percentage}% of goal</span>
            <span>{progress.target} {unit}</span>
          </div>
          <div className="w-full bg-dark-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', progress.color || 'bg-lime')}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
