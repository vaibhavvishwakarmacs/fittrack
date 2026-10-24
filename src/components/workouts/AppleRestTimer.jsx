import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  playRestCompleteChime,
  playCountdownTick,
  playTimerStartSound,
  playTimerPauseSound,
  playTimerResetSound,
  playButtonTapSound,
  triggerVibrate,
} from '../../lib/soundUtils';
import { BETWEEN_SET_TIPS } from '../../data/muscleData';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Sparkles,
  Dumbbell,
  Timer,
  CheckCircle2,
} from 'lucide-react';

export const AppleRestTimer = ({
  durationSec = 90,
  onFinish,
  onDismiss,
  nextExerciseName = '',
  nextSetNumber = 1,
  autoStart = false,
  title = 'Rest & Recovery',
}) => {
  const [totalDuration, setTotalDuration] = useState(durationSec || 90);
  const [timeLeft, setTimeLeft] = useState(durationSec || 90);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tipIndex] = useState(() => Math.floor(Math.random() * BETWEEN_SET_TIPS.length));

  // Stable callbacks using refs to prevent interval cleanup from parent re-renders
  const onFinishRef = useRef(onFinish);
  const onDismissRef = useRef(onDismiss);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
    onDismissRef.current = onDismiss;
  });

  const targetEndTimeRef = useRef(null);

  // Sync if durationSec prop changes initially
  useEffect(() => {
    const validSec = Math.max(5, durationSec || 90);
    setTotalDuration(validSec);
    setTimeLeft(validSec);
    hasFinishedRef.current = false;
    if (autoStart) {
      targetEndTimeRef.current = Date.now() + validSec * 1000;
      setIsRunning(true);
    }
  }, [durationSec, autoStart]);

  // Request WakeLock so iPhone screen stays on during rest
  useEffect(() => {
    let wakeLock = null;
    if (isRunning && 'wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((lock) => {
        wakeLock = lock;
      }).catch(() => {});
    }
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isRunning]);

  // Timestamp-based countdown that survives iOS screen locks
  useEffect(() => {
    if (!isRunning) return;

    if (!targetEndTimeRef.current) {
      targetEndTimeRef.current = Date.now() + timeLeft * 1000;
    }

    const checkTime = () => {
      const remainingMs = targetEndTimeRef.current - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      setTimeLeft(remainingSec);

      if (remainingSec <= 0) {
        if (!hasFinishedRef.current) {
          hasFinishedRef.current = true;
          setIsRunning(false);
          targetEndTimeRef.current = null;
          if (soundEnabled) {
            playRestCompleteChime();
          }
          triggerVibrate([200, 100, 200, 100, 300]);
          if (onFinishRef.current) onFinishRef.current();
        }
      } else if (remainingSec <= 3 && soundEnabled) {
        playCountdownTick();
      }
    };

    // Immediate check
    checkTime();

    const timer = setInterval(checkTime, 500);

    // Sync on iOS unlock or tab return
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        checkTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilitySync);
    window.addEventListener('pageshow', handleVisibilitySync);
    window.addEventListener('focus', handleVisibilitySync);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
      window.removeEventListener('pageshow', handleVisibilitySync);
      window.removeEventListener('focus', handleVisibilitySync);
    };
  }, [isRunning, soundEnabled]);

  // Actions
  const handleToggleStartPause = useCallback(() => {
    if (timeLeft <= 0) {
      // If already 0, reset and start
      targetEndTimeRef.current = Date.now() + totalDuration * 1000;
      setTimeLeft(totalDuration);
      hasFinishedRef.current = false;
      setIsRunning(true);
      if (soundEnabled) playTimerStartSound();
      return;
    }

    setIsRunning((prev) => {
      const nextState = !prev;
      if (nextState) {
        targetEndTimeRef.current = Date.now() + timeLeft * 1000;
        if (soundEnabled) playTimerStartSound();
      } else {
        targetEndTimeRef.current = null;
        if (soundEnabled) playTimerPauseSound();
      }
      return nextState;
    });
  }, [timeLeft, totalDuration, soundEnabled]);

  const handleAddSeconds = (secs) => {
    if (soundEnabled) playButtonTapSound();
    setTimeLeft((prev) => {
      const updated = Math.max(5, prev + secs);
      if (updated > totalDuration) {
        setTotalDuration(updated);
      }
      if (isRunning) {
        targetEndTimeRef.current = Date.now() + updated * 1000;
      }
      return updated;
    });
    hasFinishedRef.current = false;
  };

  const handleReset = () => {
    if (soundEnabled) playTimerResetSound();
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setTimeLeft(totalDuration);
    hasFinishedRef.current = false;
  };

  const handleSetPreset = (presetSec) => {
    if (soundEnabled) playButtonTapSound();
    setTotalDuration(presetSec);
    setTimeLeft(presetSec);
    if (isRunning) {
      targetEndTimeRef.current = Date.now() + presetSec * 1000;
    }
    hasFinishedRef.current = false;
  };

  const handleDismiss = () => {
    if (soundEnabled) playTimerResetSound();
    setIsRunning(false);
    if (onDismissRef.current) onDismissRef.current();
  };

  // Calculations for Ring & Display
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalDuration > 0 ? Math.max(0, Math.min(1, timeLeft / totalDuration)) : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const isLowTime = timeLeft <= 15 && timeLeft > 0 && isRunning;
  const isComplete = timeLeft === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200 select-none"
    >
      {/* iOS 26 Glassmorphism Sheet Container */}
      <div className="w-full max-w-[370px] sm:max-w-md max-h-[92vh] overflow-y-auto no-scrollbar rounded-[36px] bg-[#07090e]/85 border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(34,197,94,0.12)] p-5 sm:p-6 flex flex-col items-center relative backdrop-filter backdrop-blur-3xl saturate-180">
        {/* Top Specular Glass Sheen Reflection */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        {/* Ambient Dynamic Glow Orbs: Neon Green & Alarm Orange */}
        <div
          className={`absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isLowTime || (!isRunning && timeLeft > 0)
              ? 'bg-orange-500/15'
              : 'bg-emerald-500/20'
          }`}
        />
        <div
          className={`absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isRunning ? 'bg-lime-400/15' : 'bg-orange-600/10'
          }`}
        />

        {/* Header: Title pill & Sound Mute Toggle */}
        <div className="w-full flex items-center justify-between mb-4 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider shadow-[0_0_12px_rgba(34,197,94,0.2)]">
            <Timer className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{title}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              playButtonTapSound();
              setSoundEnabled((v) => !v);
            }}
            className={`p-2 rounded-full border transition-all ${
              soundEnabled
                ? 'bg-white/5 border-white/10 text-emerald-400 hover:text-white'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Next Set Quick Capsule */}
        {nextExerciseName && (
          <div className="w-full mb-3 px-3.5 py-1.5 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-between text-left z-10">
            <div className="min-w-0 flex items-center gap-2">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <p className="text-xs font-bold text-white truncate">
                Set #{nextSetNumber} • <span className="text-emerald-400 font-extrabold">{nextExerciseName}</span>
              </p>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold shrink-0 ml-2">Next</span>
          </div>
        )}

        {/* Circular Dial / Apple Timer Ring */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center my-1 z-10">
          {/* Subtle Outer Dial Ring */}
          <div className="absolute inset-2 rounded-full border border-white/[0.04] pointer-events-none" />

          <svg className="w-full h-full -rotate-90 filter drop-shadow-[0_0_16px_rgba(34,197,94,0.2)]" viewBox="0 0 200 200">
            <defs>
              {/* Green Gradient */}
              <linearGradient id="timerGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#bbf43d" />
              </linearGradient>

              {/* iPhone Alarm Orange Gradient */}
              <linearGradient id="timerAlarmOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff9500" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>

            {/* Inactive Track */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth="10"
              fill="transparent"
            />

            {/* Active Sweeping Arc */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke={isLowTime ? 'url(#timerAlarmOrangeGrad)' : 'url(#timerGreenGrad)'}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Time Display Centered in Dial */}
          <div className="absolute flex flex-col items-center text-center">
            <span
              className={`text-4xl sm:text-5xl font-black font-mono tracking-tight tabular-nums transition-colors duration-300 ${
                isComplete
                  ? 'text-emerald-400 scale-105'
                  : isLowTime
                  ? 'text-orange-400 animate-pulse'
                  : 'text-white'
              }`}
            >
              {timeFormatted}
            </span>

            {/* Status Indicator Pill */}
            <div className="mt-1 flex items-center justify-center">
              {isComplete ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 animate-bounce">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Time to Lift!</span>
                </span>
              ) : isRunning ? (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                    isLowTime
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 animate-pulse'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-ping ${
                      isLowTime ? 'bg-orange-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span>{isLowTime ? 'Final Countdown' : 'Resting'}</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <span>{timeLeft === totalDuration ? 'Ready to Start' : 'Paused'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Adjustment Chips (-15s, +30s, +60s) */}
        <div className="flex items-center gap-2 mt-2 mb-3 z-10">
          <button
            type="button"
            onClick={() => handleAddSeconds(-15)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all"
            title="Subtract 15 seconds"
          >
            <Minus className="w-3 h-3" />
            <span>15s</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddSeconds(30)}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-[0_0_12px_rgba(34,197,94,0.15)]"
            title="Add 30 seconds"
          >
            <Plus className="w-3 h-3" />
            <span>30s</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddSeconds(60)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all"
            title="Add 60 seconds"
          >
            <Plus className="w-3 h-3" />
            <span>60s</span>
          </button>
        </div>

        {/* Standard Preset Pills (30s, 60s, 90s, 2m, 3m) */}
        <div className="w-full flex items-center justify-center gap-1.5 mb-4 z-10 overflow-x-auto no-scrollbar py-0.5">
          {[
            { label: '30s', val: 30 },
            { label: '60s', val: 60 },
            { label: '90s', val: 90 },
            { label: '2m', val: 120 },
            { label: '3m', val: 180 },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => handleSetPreset(preset.val)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                totalDuration === preset.val
                  ? 'bg-emerald-500 text-dark-950 font-black shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* PRIMARY CONTROLS: Apple Clock Dual Circular Buttons */}
        <div className="w-full flex items-center justify-between px-4 sm:px-6 my-2 z-10">
          {/* Left Button: Cancel / Skip Rest / Reset */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={isRunning ? handleReset : handleDismiss}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white/[0.08] hover:bg-white/[0.12] active:scale-90 text-slate-200 border border-white/15 flex items-center justify-center shadow-lg transition-all"
              title={isRunning ? 'Reset Timer' : 'Skip Rest'}
            >
              {isRunning ? (
                <RotateCcw className="w-6 h-6 text-slate-300" />
              ) : (
                <FastForward className="w-6 h-6 text-slate-300" />
              )}
            </button>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isRunning ? 'Reset' : 'Skip'}
            </span>
          </div>

          {/* Right Button: START / PAUSE / RESUME Counter Button (iOS Alarm Style) */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={handleToggleStartPause}
              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center active:scale-90 transition-all duration-200 ${
                isRunning
                  ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border-2 border-orange-500/60 shadow-[0_0_30px_rgba(255,149,0,0.45)]'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-2 border-emerald-500/60 shadow-[0_0_30px_rgba(34,197,94,0.45)]'
              }`}
              title={isRunning ? 'Pause Counter' : 'Start Counter'}
            >
              {isRunning ? (
                <Pause className="w-7 h-7 fill-current stroke-[2.5]" />
              ) : (
                <Play className="w-7 h-7 fill-current translate-x-0.5 stroke-[2.5]" />
              )}
            </button>
            <span
              className={`text-[11px] font-black uppercase tracking-wider ${
                isRunning ? 'text-orange-400' : 'text-emerald-400'
              }`}
            >
              {isRunning ? 'Pause' : timeLeft === totalDuration ? 'Start' : 'Resume'}
            </span>
          </div>
        </div>

        {/* Pro Recovery Cue Card */}
        <div className="w-full mt-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-left z-10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Optimal Recovery Form Cue</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
            {BETWEEN_SET_TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};
