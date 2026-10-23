import React from 'react';
import { Button } from './Button';

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-white/10 bg-dark-900/40 my-4">
      <div className="w-14 h-14 rounded-2xl bg-dark-850 border border-white/5 flex items-center justify-center text-lime mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="text-base font-bold text-white tracking-tight mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-xs mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm" leftIcon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
