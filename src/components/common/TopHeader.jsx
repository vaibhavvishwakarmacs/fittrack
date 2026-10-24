import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footprints, Settings, Zap } from 'lucide-react';

export const TopHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-[#07090f]/90 backdrop-blur-2xl border-b border-white/[0.06] px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3 transition-all">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Clean Brand Logo & Title without debug badges */}
        <Link to="/app/dashboard" className="flex items-center gap-2.5 focus:outline-none group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-lime to-lime-bright flex items-center justify-center text-dark-950 shadow-lime-sm group-hover:scale-105 transition-transform shrink-0">
            <Zap className="w-5 h-5 fill-current stroke-none" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white font-sans">
              FitTrack
            </span>
          </div>
        </Link>

        {/* Clean Action Shortcuts */}
        <div className="flex items-center gap-2">
          {/* Quick Activity Button */}
          <button
            onClick={() => navigate('/app/activity')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/10 text-slate-200 hover:text-white transition-all text-xs font-semibold focus:outline-none"
            title="Daily Activity & Steps"
          >
            <Footprints className="w-3.5 h-3.5 text-lime" />
            <span className="font-semibold text-white">Activity</span>
          </button>

          {/* Settings shortcut */}
          <Link
            to="/app/settings"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/10 text-slate-300 hover:text-white transition-all focus:outline-none"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
