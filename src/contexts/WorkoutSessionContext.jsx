import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, Play, X } from 'lucide-react';

const LOCAL_SESSION_KEY = 'fittrack_live_session_state';
const WorkoutSessionContext = createContext(null);

export const WorkoutSessionProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [hasActiveSavedSession, setHasActiveSavedSession] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_SESSION_KEY);
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      return Boolean(parsed && parsed.sessionStartTimeMs);
    } catch {
      return false;
    }
  });

  const [sessionTitle, setSessionTitle] = useState('Active Workout');

  // Keep state synced with localStorage
  const checkSavedSession = useCallback(() => {
    try {
      const stored = localStorage.getItem(LOCAL_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.sessionStartTimeMs) {
          setHasActiveSavedSession(true);
          if (parsed.sessionTitle) setSessionTitle(parsed.sessionTitle);
          return;
        }
      }
    } catch {}
    setHasActiveSavedSession(false);
  }, []);

  useEffect(() => {
    checkSavedSession();
    const interval = setInterval(checkSavedSession, 2000);
    window.addEventListener('storage', checkSavedSession);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkSavedSession);
    };
  }, [checkSavedSession]);

  const startSession = (callback) => {
    navigate('/app/session');
  };

  const resumeSession = () => {
    navigate('/app/session');
  };

  const endSession = () => {
    try {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    } catch {}
    setHasActiveSavedSession(false);
  };

  const isOnSessionPage = location.pathname.includes('/session');

  return (
    <WorkoutSessionContext.Provider
      value={{
        isSessionActive: hasActiveSavedSession,
        hasActiveSavedSession,
        startSession,
        resumeSession,
        endSession,
        checkSavedSession,
      }}
    >
      {children}

      {/* Minimized Floating Island / Active Session Pill (Apple Watch / Dynamic Island style) */}
      {hasActiveSavedSession && !isOnSessionPage && (
        <aside 
          aria-label="Active Workout Session"
          className="fixed bottom-[max(5.5rem,calc(env(safe-area-inset-bottom,16px)+4.5rem))] left-3 right-3 z-40 max-w-md mx-auto bg-[#07090e]/95 backdrop-blur-3xl border border-emerald-500/30 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(34,197,94,0.2)] flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300"
        >
          <div
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
            onClick={resumeSession}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Dumbbell className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="truncate">{sessionTitle}</span>
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold truncate">
                Tap to resume where you left off
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={resumeSession}
              className="px-3.5 py-1.5 rounded-xl bg-lime hover:bg-lime-bright text-dark-950 font-black text-xs flex items-center gap-1 shadow-lime-sm active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
            <button
              onClick={endSession}
              className="text-[11px] text-slate-400 hover:text-rose-400 px-1.5 py-1 transition-colors"
              title="Discard session"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
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
