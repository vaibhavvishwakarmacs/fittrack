import React, { createContext, useContext, useState, useEffect } from 'react';
import { LiveWorkoutSession } from '../components/workouts/LiveWorkoutSession';
import { Dumbbell, Play, ChevronUp } from 'lucide-react';

const WorkoutSessionContext = createContext(null);

export const WorkoutSessionProvider = ({ children }) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [onSessionSavedCallback, setOnSessionSavedCallback] = useState(null);

  const startSession = (callback) => {
    if (callback) {
      setOnSessionSavedCallback(() => callback);
    }
    setIsSessionActive(true);
    setIsMinimized(false);
  };

  const closeSession = () => {
    setIsSessionActive(false);
    setIsMinimized(false);
  };

  const minimizeSession = () => {
    setIsMinimized(true);
  };

  const resumeSession = () => {
    setIsMinimized(false);
  };

  return (
    <WorkoutSessionContext.Provider
      value={{
        isSessionActive,
        isMinimized,
        startSession,
        closeSession,
        minimizeSession,
        resumeSession,
      }}
    >
      {children}

      {/* Full-Screen Live Workout Session */}
      {isSessionActive && !isMinimized && (
        <LiveWorkoutSession
          isOpen={true}
          onClose={minimizeSession}
          onWorkoutSaved={() => {
            if (onSessionSavedCallback) {
              onSessionSavedCallback();
            }
            closeSession();
          }}
        />
      )}

      {/* Minimized Floating Island / Active Session Pill (Apple style) */}
      {isSessionActive && isMinimized && (
        <div className="fixed bottom-[max(5rem,calc(env(safe-area-inset-bottom,16px)+4rem))] left-3 right-3 z-40 max-w-md mx-auto bg-[#07090e]/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(34,197,94,0.15)] flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={resumeSession}>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Dumbbell className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Live Workout Active</span>
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold truncate">Tap to return to session</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={resumeSession}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-dark-950 font-black text-xs flex items-center gap-1 shadow-[0_0_12px_rgba(34,197,94,0.35)] active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
            <button
              onClick={closeSession}
              className="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 transition-colors"
            >
              End
            </button>
          </div>
        </div>
      )}
    </WorkoutSessionContext.Provider>
  );
};

export const useWorkoutSession = () => {
  const context = useContext(WorkoutSessionContext);
  if (!context) {
    throw new Error('useWorkoutSession must be used within a WorkoutSessionProvider');
  }
  return context;
};
