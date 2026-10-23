import React from 'react';

export const LoadingSpinner = ({
  label = 'Loading your fitness data...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[220px] p-6 text-center">
      <div
        className={`${sizeClasses[size]} border-lime/20 border-t-lime rounded-full animate-spin mb-3`}
      />
      {label && <p className="text-xs text-slate-400 font-medium animate-pulse">{label}</p>}
    </div>
  );
};
