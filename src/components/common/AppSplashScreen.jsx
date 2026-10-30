import React from 'react';

export const AppSplashScreen = ({ message = 'FitTrack' }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#090a0f] flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-200">
      {/* Background ambient radial glow */}
      <div className="absolute w-72 h-72 rounded-full bg-lime/10 blur-3xl pointer-events-none -translate-y-6" />

      {/* Branded Logo with pulsing glow */}
      <div className="relative flex flex-col items-center">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-dark-900 border border-white/10 shadow-2xl shadow-lime/20 flex items-center justify-center p-4 relative group">
          <svg viewBox="0 0 512 512" className="w-full h-full drop-shadow-[0_0_16px_rgba(204,255,0,0.6)] animate-pulse">
            <defs>
              <linearGradient id="splashLimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ccff00" />
                <stop offset="100%" stopColor="#84cc16" />
              </linearGradient>
            </defs>
            <g transform="translate(64, 64) scale(0.75)">
              <rect x="60" y="140" width="40" height="232" rx="16" fill="url(#splashLimeGrad)" />
              <rect x="110" y="180" width="30" height="152" rx="12" fill="url(#splashLimeGrad)" />
              <rect x="140" y="236" width="232" height="40" rx="8" fill="#ffffff" />
              <path d="M 230 190 L 290 256 L 250 266 L 285 330 L 220 260 L 255 250 Z" fill="url(#splashLimeGrad)" />
              <rect x="372" y="180" width="30" height="152" rx="12" fill="url(#splashLimeGrad)" />
              <rect x="412" y="140" width="40" height="232" rx="16" fill="url(#splashLimeGrad)" />
            </g>
          </svg>
        </div>

        {/* Brand Name & Tagline */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              FitTrack
            </h1>
            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-lime text-dark-950 tracking-wider">
              PRO
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
            {message}
          </p>
        </div>

        {/* Minimalist neon progress line */}
        <div className="w-36 h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-lime to-lime-bright rounded-full w-2/3 animate-[pulse_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};
