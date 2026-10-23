import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Zap, ShieldCheck, Activity, Award } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      <header className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <Link to="/login" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lime to-lime-bright flex items-center justify-center text-dark-950 shadow-lime-sm">
            <Zap className="w-5 h-5 fill-current stroke-none" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white font-sans">
            FitTrack
          </span>
        </Link>
        <span className="text-xs font-medium text-slate-400 bg-dark-900 border border-white/5 px-2.5 py-1 rounded-full">
          Mobile PWA
        </span>
      </header>

      <main className="max-w-md w-full mx-auto my-auto py-8">
        <Outlet />
      </main>

      <footer className="max-w-md w-full mx-auto pb-4 pt-2">
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400 border-t border-white/[0.06] pt-4">
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-lime" />
            <span>MongoDB Private</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Live Workout Logs</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Progress Milestones</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
