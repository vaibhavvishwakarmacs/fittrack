import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WORKOUT_ROUTINES, MUSCLE_GROUPS, EXERCISE_VARIATIONS_BY_MUSCLE } from '../../data/muscleData';
import { BodyTargetDiagram } from './BodyTargetDiagram';
import { AppleRestTimer } from './AppleRestTimer';
import { ExerciseVariationPicker } from './ExerciseVariationPicker';
import { Button } from '../common/Button';
import { workoutService } from '../../services/workoutService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { playSetCompleteSound, playButtonTapSound } from '../../lib/soundUtils';
import confetti from 'canvas-confetti';
import {
  Clock,
  Dumbbell,
  Flame,
  Award,
  ChevronRight,
  Plus,
  Trash2,
  Check,
  Minimize2,
  ChevronDown,
  Layers,
  Calendar as CalendarIcon,
  Timer,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';

const LOCAL_SESSION_KEY = 'fittrack_live_session_state';

export const LiveWorkoutSession = ({ isOpen, onClose, onWorkoutSaved }) => {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();

  const unit = profile?.unit_system === 'imperial' ? 'lbs' : 'kg';

  // Load saved session if exists
  const getInitialState = () => {
    try {
      const stored = localStorage.getItem(LOCAL_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.sessionStartTimeMs) {
          return parsed;
        }
      }
    } catch {}
    return null;
  };

  const initialSaved = getInitialState();

  // 1. Session Timing & Wall-Clock State (Resistant to iOS Screen Locks)
  const [sessionStartTimeMs, setSessionStartTimeMs] = useState(
    () => initialSaved?.sessionStartTimeMs || Date.now()
  );
  const [totalPausedMs, setTotalPausedMs] = useState(
    () => initialSaved?.totalPausedMs || 0
  );
  const [isPaused, setIsPaused] = useState(
    () => Boolean(initialSaved?.isPaused)
  );
  const [pausedAtMs, setPausedAtMs] = useState(
    () => initialSaved?.pausedAtMs || null
  );

  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (!initialSaved) return 0;
    const now = Date.now();
    const effectiveNow = initialSaved.isPaused && initialSaved.pausedAtMs ? initialSaved.pausedAtMs : now;
    return Math.max(0, Math.floor((effectiveNow - initialSaved.sessionStartTimeMs - (initialSaved.totalPausedMs || 0)) / 1000));
  });

  const startTimeObj = useMemo(() => new Date(sessionStartTimeMs), [sessionStartTimeMs]);
  const dateFormatted = startTimeObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const dayOfWeek = startTimeObj.toLocaleDateString('en-US', { weekday: 'long' });
  const startTimeFormatted = startTimeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // 2. Setup Step State
  const [isSetupDone, setIsSetupDone] = useState(() => Boolean(initialSaved?.isSetupDone));
  const [selectedRoutineId, setSelectedRoutineId] = useState(() => initialSaved?.selectedRoutineId || 'chest_triceps');
  const [targetMuscles, setTargetMuscles] = useState(() => initialSaved?.targetMuscles || ['chest', 'triceps', 'shoulders']);
  const [sessionTitle, setSessionTitle] = useState(() => initialSaved?.sessionTitle || 'Chest & Triceps Hypertrophy');

  // 3. Exercises State
  const [exercises, setExercises] = useState(() => initialSaved?.exercises || []);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(() => initialSaved?.activeExerciseIndex || 0);

  // 4. Apple Rest Timer
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restDurationSec, setRestDurationSec] = useState(90);
  const [restTimerTitle, setRestTimerTitle] = useState('Rest & Recovery');
  const [restTimerAutoStart, setRestTimerAutoStart] = useState(true);

  // 5. Variation Picker
  const [isVariationPickerOpen, setIsVariationPickerOpen] = useState(false);
  const [pickerTargetMuscle, setPickerTargetMuscle] = useState('chest');

  // 6. Finish & Discard modals
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Screen WakeLock for iOS Safari / Mobile
  useEffect(() => {
    let wakeLock = null;
    if (isOpen && 'wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((lock) => {
        wakeLock = lock;
      }).catch(() => {});
    }
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isOpen]);

  // Wall-Clock Accurate Stopwatch Loop & iOS Background Wakeup
  useEffect(() => {
    if (!isOpen) return;

    const syncElapsed = () => {
      if (isPaused) {
        if (pausedAtMs) {
          const elapsed = Math.max(0, Math.floor((pausedAtMs - sessionStartTimeMs - totalPausedMs) / 1000));
          setElapsedSeconds(elapsed);
        }
        return;
      }
      const now = Date.now();
      const elapsed = Math.max(0, Math.floor((now - sessionStartTimeMs - totalPausedMs) / 1000));
      setElapsedSeconds(elapsed);
    };

    syncElapsed();
    const interval = setInterval(syncElapsed, 500);

    // Sync on iOS unlock or app return
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        syncElapsed();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilitySync);
    window.addEventListener('pageshow', handleVisibilitySync);
    window.addEventListener('focus', handleVisibilitySync);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
      window.removeEventListener('pageshow', handleVisibilitySync);
      window.removeEventListener('focus', handleVisibilitySync);
    };
  }, [isOpen, isPaused, sessionStartTimeMs, totalPausedMs, pausedAtMs]);

  // Persist current session state to localStorage
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stateToSave = {
        sessionStartTimeMs,
        totalPausedMs,
        isPaused,
        pausedAtMs,
        isSetupDone,
        selectedRoutineId,
        targetMuscles,
        sessionTitle,
        exercises,
        activeExerciseIndex,
        savedAt: Date.now(),
      };
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save session state to localStorage:', e);
    }
  }, [
    isOpen,
    sessionStartTimeMs,
    totalPausedMs,
    isPaused,
    pausedAtMs,
    isSetupDone,
    selectedRoutineId,
    targetMuscles,
    sessionTitle,
    exercises,
    activeExerciseIndex,
  ]);

  // Toggle Pause / Resume Stopwatch
  const handleTogglePause = () => {
    if (isPaused) {
      // Resuming
      const pauseDuration = pausedAtMs ? Date.now() - pausedAtMs : 0;
      setTotalPausedMs((prev) => prev + pauseDuration);
      setPausedAtMs(null);
      setIsPaused(false);
    } else {
      // Pausing
      setPausedAtMs(Date.now());
      setIsPaused(true);
    }
  };

  // Routine Change Handler
  const handleRoutineChange = (routineId) => {
    setSelectedRoutineId(routineId);
    const routine = WORKOUT_ROUTINES.find((r) => r.id === routineId);
    if (routine) {
      setTargetMuscles(routine.defaultMuscles);
      setSessionTitle(routine.label);
    }
  };

  const toggleTargetMuscle = (muscleId) => {
    setTargetMuscles((prev) =>
      prev.includes(muscleId) ? prev.filter((m) => m !== muscleId) : [...prev, muscleId]
    );
  };

  // Confirm Setup: Load 3 Default Variations Per Muscle!
  const handleConfirmSetup = (withPrepCountdown = false) => {
    if (targetMuscles.length === 0) {
      toastError('Please select at least one target muscle group.');
      return;
    }

    // Default 3 variations per targeted muscle group
    const initialExercises = targetMuscles.flatMap((muscle) => {
      const available = EXERCISE_VARIATIONS_BY_MUSCLE[muscle] || [];
      const variationsForMuscle = available.slice(0, 3);
      if (variationsForMuscle.length === 0) {
        variationsForMuscle.push({
          name: `${muscle.toUpperCase()} Movement`,
          target: `${muscle.toUpperCase()} Hypertrophy`,
          tips: ['Perform with strict form and full range of motion.'],
          defaultRestSec: 90,
        });
      }

      return variationsForMuscle.map((v, vIdx) => ({
        muscle,
        name: v.name,
        target: v.target,
        tips: v.tips || [],
        image: v.image || null,
        defaultRestSec: v.defaultRestSec || 90,
        startedAt: null,
        completedAt: null,
        sets: [
          { setNumber: 1, weightKg: 50, reps: 10, support: 'warmup', isCompleted: false, completedAt: null },
          { setNumber: 2, weightKg: 70, reps: 8, support: 'normal', isCompleted: false, completedAt: null },
          { setNumber: 3, weightKg: 70, reps: 8, support: 'normal', isCompleted: false, completedAt: null },
        ],
      }));
    });

    setExercises(initialExercises);
    setActiveExerciseIndex(0);
    setIsSetupDone(true);

    if (withPrepCountdown) {
      handleOpenRestTimer(10, 'Get Ready! 10s Prep Countdown', true);
    }
  };

  // Set updates with entry timestamp recording
  const handleToggleSetComplete = (exIdx, setIdx) => {
    setExercises((prev) => {
      const copy = [...prev];
      const targetSet = copy[exIdx].sets[setIdx];
      const willBeCompleted = !targetSet.isCompleted;
      const nowIso = new Date().toISOString();

      targetSet.isCompleted = willBeCompleted;
      targetSet.completedAt = willBeCompleted ? nowIso : null;

      // Track variation start timestamp
      if (!copy[exIdx].startedAt && willBeCompleted) {
        copy[exIdx].startedAt = nowIso;
      }

      // Check if all sets for this exercise are now completed
      const allDone = copy[exIdx].sets.every((s) => s.isCompleted);
      if (allDone) {
        copy[exIdx].completedAt = nowIso;
      }

      if (willBeCompleted) {
        playSetCompleteSound();
        const defRest = copy[exIdx].defaultRestSec || 90;
        handleOpenRestTimer(defRest, `Set #${targetSet.setNumber} Rest`, true);
      }
      return copy;
    });
  };

  const handleUpdateSetValue = (exIdx, setIdx, field, value) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[exIdx].sets[setIdx] = {
        ...copy[exIdx].sets[setIdx],
        [field]: value,
      };
      return copy;
    });
  };

  const handleAddSetToExercise = (exIdx) => {
    playButtonTapSound();
    setExercises((prev) => {
      const copy = [...prev];
      const curSets = copy[exIdx].sets;
      const lastSet = curSets[curSets.length - 1];
      curSets.push({
        setNumber: curSets.length + 1,
        weightKg: lastSet ? lastSet.weightKg : 60,
        reps: lastSet ? lastSet.reps : 10,
        support: 'normal',
        isCompleted: false,
        completedAt: null,
      });
      return copy;
    });
  };

  const handleRemoveSet = (exIdx, setIdx) => {
    playButtonTapSound();
    setExercises((prev) => {
      const copy = [...prev];
      copy[exIdx].sets = copy[exIdx].sets
        .filter((_, i) => i !== setIdx)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      return copy;
    });
  };

  const handleSelectVariation = (variation, muscle) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[activeExerciseIndex] = {
        ...copy[activeExerciseIndex],
        muscle,
        name: variation.name,
        target: variation.target,
        tips: variation.tips || [],
        image: variation.image || null,
        defaultRestSec: variation.defaultRestSec || 90,
      };
      return copy;
    });
  };

  const handleAddNewExerciseMovement = () => {
    setPickerTargetMuscle(targetMuscles[0] || 'chest');
    setIsVariationPickerOpen(true);
  };

  // Rest Timer handlers
  const handleOpenRestTimer = useCallback((duration = 90, title = 'Rest & Recovery', autoStart = false) => {
    setRestDurationSec(duration);
    setRestTimerTitle(title);
    setRestTimerAutoStart(autoStart);
    setIsRestTimerActive(true);
  }, []);

  const handleCloseRestTimer = useCallback(() => {
    setIsRestTimerActive(false);
  }, []);

  // Format Stopwatch
  const formatStopwatch = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Volume & Stats
  const totalVolume = useMemo(() => {
    return exercises.reduce((acc, ex) => {
      return (
        acc +
        ex.sets.reduce((sAcc, s) => {
          return s.isCompleted ? sAcc + (Number(s.weightKg) || 0) * (Number(s.reps) || 0) : sAcc;
        }, 0)
      );
    }, 0);
  }, [exercises]);

  const completedSetsCount = useMemo(() => {
    return exercises.reduce((acc, ex) => {
      return acc + ex.sets.filter((s) => s.isCompleted).length;
    }, 0);
  }, [exercises]);

  const estimatedBurn = Math.round((elapsedSeconds / 60) * 6.5 + completedSetsCount * 4);

  const currentExercise = exercises[activeExerciseIndex];

  // VARIATION TIMING & LONGEST BREAK ANALYSIS (Based on entry times)
  const currentVariationStats = useMemo(() => {
    if (!currentExercise) return null;
    const completedSets = currentExercise.sets.filter((s) => s.isCompleted && s.completedAt);
    if (completedSets.length === 0) return null;

    const firstTime = new Date(currentExercise.startedAt || completedSets[0].completedAt).getTime();
    const lastTime = new Date(completedSets[completedSets.length - 1].completedAt).getTime();
    const totalVariationSec = Math.max(0, Math.round((lastTime - firstTime) / 1000));

    let longestBreakSec = 0;
    let longestBreakDetail = null;

    for (let i = 1; i < completedSets.length; i++) {
      const prevTime = new Date(completedSets[i - 1].completedAt).getTime();
      const currTime = new Date(completedSets[i].completedAt).getTime();
      const breakSec = Math.max(0, Math.round((currTime - prevTime) / 1000));

      if (breakSec > longestBreakSec) {
        longestBreakSec = breakSec;
        longestBreakDetail = {
          seconds: breakSec,
          between: `Set #${completedSets[i - 1].setNumber} → Set #${completedSets[i].setNumber}`,
          loggedAt: new Date(completedSets[i].completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
    }

    return {
      totalVariationSec,
      longestBreakSec,
      longestBreakDetail,
      completedCount: completedSets.length,
      totalSets: currentExercise.sets.length,
    };
  }, [currentExercise]);

  // Finish and Save to MongoDB
  const handleSaveAndCompleteSession = async () => {
    if (!user) {
      toastError('Please sign in to save your workout.');
      return;
    }

    setIsSaving(true);
    try {
      const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
      const payload = {
        title: sessionTitle || `${dayOfWeek} Workout`,
        category: targetMuscles.includes('cardio') ? 'hybrid' : 'strength',
        targetMuscles,
        dayOfWeek,
        durationMinutes: durationMins,
        startedAt: new Date(sessionStartTimeMs).toISOString(),
        exercises: exercises.map((ex, exIdx) => ({
          name: ex.name,
          category: ex.muscle,
          orderIndex: exIdx,
          imageUrl: ex.image || null,
          targetMuscles: [ex.muscle],
          tips: ex.tips || [],
          sets: ex.sets.map((s) => ({
            setNumber: s.setNumber,
            weightKg: Number(s.weightKg) || 0,
            reps: Number(s.reps) || 0,
            support: s.support || 'normal',
            isCompleted: s.isCompleted,
            completedAt: s.completedAt || null,
          })),
        })),
      };

      const { error } = await workoutService.createWorkout(user.id, payload);
      if (error) {
        toastError(error.message || 'Failed to save session to MongoDB.');
      } else {
        try {
          localStorage.removeItem(LOCAL_SESSION_KEY);
        } catch {}

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#22c55e', '#bbf43d', '#ff9500', '#38bdf8'],
        });
        success(`Workout saved! Volume: ${totalVolume.toLocaleString()} ${unit}`);
        if (onWorkoutSaved) onWorkoutSaved();
        if (onClose) onClose();
      }
    } catch (err) {
      toastError(err?.message || 'Error saving workout session.');
    } finally {
      setIsSaving(false);
      setIsFinishModalOpen(false);
    }
  };

  // Discard Session Handler
  const handleConfirmDiscard = () => {
    try {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    } catch {}
    setIsDiscardModalOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#04060a] text-white flex flex-col overflow-y-auto overflow-x-hidden no-scrollbar animate-in fade-in select-none overscroll-none touch-pan-y w-full max-w-full">
      {/* Top Header - iPhone Notch & Safe Area Respected */}
      <header className="sticky top-0 z-30 bg-[#07090f]/90 backdrop-blur-2xl border-b border-white/[0.08] px-3 sm:px-6 pt-[max(env(safe-area-inset-top),16px)] pb-3 transition-all w-full max-w-full">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Auto Day & Time Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-lime/15 border border-lime/30 flex items-center justify-center text-lime shadow-lime-sm shrink-0">
              <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-lime animate-pulse shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-wider text-lime truncate">
                  Live
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate">• {dayOfWeek}</span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-white tracking-tight leading-tight truncate">
                {isSetupDone ? sessionTitle : 'Session Setup'}
              </p>
            </div>
          </div>

          {/* Center: Live Stopwatch HUD (Desktop) */}
          {isSetupDone && (
            <div className="hidden sm:flex items-center gap-5 bg-white/[0.04] px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg">
              <div className="text-center">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Duration</span>
                <span className="text-base font-black text-white font-mono">{formatStopwatch(elapsedSeconds)}</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Volume</span>
                <span className="text-base font-black text-lime font-mono">
                  {totalVolume.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{unit}</span>
                </span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Active Burn</span>
                <span className="text-base font-black text-orange-400 font-mono">
                  {estimatedBurn} <span className="text-[10px] font-normal text-slate-400">kcal</span>
                </span>
              </div>
            </div>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isSetupDone && (
              <button
                type="button"
                onClick={handleTogglePause}
                className={`p-2 rounded-xl border transition-all ${
                  isPaused
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
                title={isPaused ? 'Resume Timer' : 'Pause Workout'}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
              </button>
            )}

            {isSetupDone && (
              <button
                type="button"
                onClick={() =>
                  handleOpenRestTimer(
                    currentExercise?.defaultRestSec || 90,
                    `${currentExercise?.name || 'Workout'} Rest`,
                    false
                  )
                }
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 active:scale-95 border border-orange-500/35 text-orange-400 text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,149,0,0.2)]"
                title="Open Rest Timer"
              >
                <Timer className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs">Rest</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
              title="Minimize Session (Continues in Background)"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {isSetupDone && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsFinishModalOpen(true)}
                className="text-xs px-3 font-bold"
              >
                Finish
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* ================= STEP 1: SETUP SCREEN ================= */}
        {!isSetupDone ? (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in max-w-2xl mx-auto">
            {/* Auto Time Stamp Strip */}
            <div className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-lime" />
                <span className="text-slate-300">
                  Date: <strong className="text-white">{dateFormatted}</strong> ({dayOfWeek})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-slate-300">
                  Started: <strong className="text-white">{startTimeFormatted}</strong>
                </span>
              </div>
            </div>

            {/* Workout Split Dropdown */}
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-4 sm:p-6 space-y-3 backdrop-blur-xl">
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                  1. Workout Routine Split
                </label>
                <p className="text-xs text-slate-400">
                  Pick a routine or customize. FitTrack automatically generates 3 variations per muscle!
                </p>
              </div>

              <div className="relative">
                <select
                  value={selectedRoutineId}
                  onChange={(e) => handleRoutineChange(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-white/15 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-lime appearance-none pr-10 cursor-pointer"
                >
                  {WORKOUT_ROUTINES.map((r) => (
                    <option key={r.id} value={r.id} className="bg-dark-900 text-white">
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Target Muscles Multi-Select Zone */}
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-4 sm:p-6 space-y-4 backdrop-blur-xl">
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                  2. Targeted Muscles (Select ~1 to 3 Groups)
                </label>
                <p className="text-xs text-slate-400">
                  Each selected group automatically loads 3 movements. Includes Cardio &amp; Conditioning!
                </p>
              </div>

              {/* Muscle Pills Multi-Select */}
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map((m) => {
                  const isSelected = targetMuscles.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleTargetMuscle(m.id)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                        isSelected
                          ? 'bg-lime text-dark-950 font-black shadow-lime-sm scale-105'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      <span>{m.label.split(' ')[0]}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Anatomical Human Body Diagram */}
              <BodyTargetDiagram targetedMuscles={targetMuscles} />
            </div>

            {/* Launch Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleConfirmSetup(false)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="w-full sm:w-auto font-black"
              >
                Begin Workout Session ({targetMuscles.length * 3} Movements)
              </Button>
            </div>
          </div>
        ) : (
          /* ================= STEP 2: ACTIVE EXERCISE SESSION FLOW ================= */
          <div className="space-y-4 sm:space-y-6 animate-in fade-in pb-16 overflow-x-hidden">
            {/* Mobile Top Stats Bar */}
            <div className="sm:hidden grid grid-cols-4 gap-1.5 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center text-xs backdrop-blur-xl">
              <div className="p-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Time</span>
                <span className="font-extrabold text-white font-mono text-xs">{formatStopwatch(elapsedSeconds)}</span>
              </div>
              <div className="p-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Volume</span>
                <span className="font-extrabold text-lime font-mono text-xs">
                  {totalVolume} <span className="text-[8px] font-normal">{unit}</span>
                </span>
              </div>
              <div className="p-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Burn</span>
                <span className="font-extrabold text-orange-400 font-mono text-xs">{estimatedBurn}k</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleOpenRestTimer(
                    currentExercise?.defaultRestSec || 90,
                    'Rest & Recovery',
                    false
                  )
                }
                className="p-1 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex flex-col items-center justify-center active:scale-95 transition-all"
              >
                <span className="text-[8px] uppercase font-bold flex items-center gap-0.5">
                  <Timer className="w-2.5 h-2.5" />
                  <span>Timer</span>
                </span>
                <span className="font-extrabold text-white text-xs">{currentExercise?.defaultRestSec || 90}s</span>
              </button>
            </div>

            {/* Exercise Carousel Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 touch-pan-x">
              {exercises.map((ex, idx) => {
                const isActive = activeExerciseIndex === idx;
                const completedSets = ex.sets.filter((s) => s.isCompleted).length;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveExerciseIndex(idx)}
                    className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                      isActive
                        ? 'bg-lime text-dark-950 font-black shadow-lime-sm scale-105'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10'
                    }`}
                  >
                    <span>{idx + 1}. {ex.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isActive ? 'bg-dark-950/20 text-dark-950 font-black' : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {completedSets}/{ex.sets.length}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={handleAddNewExerciseMovement}
                className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-xs font-bold text-lime bg-lime/10 hover:bg-lime/20 border border-dashed border-lime/30 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Movement</span>
              </button>
            </div>

            {/* Current Active Movement Focus Card */}
            {currentExercise && (
              <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-4 sm:p-7 space-y-5 backdrop-blur-2xl shadow-2xl">
                {/* Movement Header + Variation Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-lime/15 text-lime border border-lime/30">
                        Target: {currentExercise.muscle.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">
                        Movement {activeExerciseIndex + 1} of {exercises.length}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                      {currentExercise.name}
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">{currentExercise.target}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenRestTimer(
                          currentExercise.defaultRestSec || 90,
                          `${currentExercise.name} Rest`,
                          false
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 text-xs font-bold transition-all shadow-[0_0_12px_rgba(255,149,0,0.15)] active:scale-95"
                      title="Start Wait / Rest Timer"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>Rest ({currentExercise.defaultRestSec || 90}s)</span>
                    </button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setPickerTargetMuscle(currentExercise.muscle);
                        setIsVariationPickerOpen(true);
                      }}
                      leftIcon={<Layers className="w-3.5 h-3.5 text-lime" />}
                    >
                      Switch
                    </Button>
                  </div>
                </div>

                {/* Form Tips & Image */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#090c13]/80 border border-white/5 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-lime tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Form Cues &amp; Execution Tips</span>
                    </span>
                    <ul className="text-xs text-slate-300 list-disc list-inside space-y-0.5">
                      {(currentExercise.tips || []).map((tip, tIdx) => (
                        <li key={tIdx} className="leading-relaxed">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {currentExercise.image && (
                    <img
                      src={currentExercise.image}
                      alt={currentExercise.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-white/10 shrink-0 self-center sm:self-auto"
                    />
                  )}
                </div>

                {/* VARIATION TIMING & LONGEST REST STATS BANNER */}
                {currentVariationStats && (
                  <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-dark-850 to-lime/10 border border-lime/25 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-lime" />
                      <span className="text-slate-300">
                        Variation Duration:{' '}
                        <strong className="text-white font-mono">
                          {formatStopwatch(currentVariationStats.totalVariationSec)}
                        </strong>
                      </span>
                    </div>

                    {currentVariationStats.longestBreakDetail ? (
                      <div className="flex items-center gap-2 text-xs">
                        <Timer className="w-4 h-4 text-orange-400" />
                        <span className="text-slate-300">
                          Longest Break:{' '}
                          <strong className="text-orange-400 font-mono">
                            {formatStopwatch(currentVariationStats.longestBreakSec)}
                          </strong>{' '}
                          <span className="text-slate-400">
                            ({currentVariationStats.longestBreakDetail.between} at{' '}
                            {currentVariationStats.longestBreakDetail.loggedAt})
                          </span>
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400">
                        {currentVariationStats.completedCount === 1 ? '1 set logged' : `${currentVariationStats.completedCount} sets logged`}
                      </div>
                    )}
                  </div>
                )}

                {/* Sets & Load Entries */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Sets &amp; Load Entries
                    </h3>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Timer className="w-3 h-3 text-orange-400" />
                      <span>Rest: {currentExercise.defaultRestSec || 90}s</span>
                    </span>
                  </div>

                  {/* DESKTOP TABLE VIEW (sm: and above) */}
                  <div className="hidden sm:block space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase px-2">
                      <span className="col-span-2">Set</span>
                      <span className="col-span-3">Weight ({unit})</span>
                      <span className="col-span-3">Reps</span>
                      <span className="col-span-2">Support / Tag</span>
                      <span className="col-span-2 text-right">Log / Rest</span>
                    </div>

                    {currentExercise.sets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl border transition-all ${
                          set.isCompleted
                            ? 'bg-lime/10 border-lime/30 shadow-[0_0_12px_rgba(187,244,61,0.1)]'
                            : 'bg-white/[0.03] border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="col-span-2 flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                              set.isCompleted ? 'bg-lime text-dark-950 font-black' : 'bg-white/10 text-slate-300'
                            }`}
                          >
                            #{set.setNumber}
                          </span>
                          {set.completedAt && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(set.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        {/* Direct Number Input without stubborn '0' */}
                        <div className="col-span-3">
                          <input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*[.,]?[0-9]*"
                            value={set.weightKg === 0 || set.weightKg === '0' ? '' : set.weightKg}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value.replace(',', '.');
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                handleUpdateSetValue(
                                  activeExerciseIndex,
                                  setIdx,
                                  'weightKg',
                                  val === '' ? 0 : val
                                );
                              }
                            }}
                            className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-lime"
                          />
                        </div>

                        <div className="col-span-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={set.reps === 0 || set.reps === '0' ? '' : set.reps}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*$/.test(val)) {
                                handleUpdateSetValue(
                                  activeExerciseIndex,
                                  setIdx,
                                  'reps',
                                  val === '' ? 0 : val
                                );
                              }
                            }}
                            className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-lime"
                          />
                        </div>

                        <div className="col-span-2">
                          <select
                            value={set.support || 'normal'}
                            onChange={(e) =>
                              handleUpdateSetValue(
                                activeExerciseIndex,
                                setIdx,
                                'support',
                                e.target.value
                              )
                            }
                            className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-1.5 py-1.5 text-[10px] font-bold text-slate-300 focus:outline-none focus:border-lime capitalize"
                          >
                            <option value="normal">Normal</option>
                            <option value="warmup">Warmup</option>
                            <option value="drop_set">Drop Set</option>
                            <option value="assisted">Spotter Support</option>
                            <option value="failure">To Failure</option>
                          </select>
                        </div>

                        <div className="col-span-2 flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSetComplete(activeExerciseIndex, setIdx)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                              set.isCompleted
                                ? 'bg-lime text-dark-950 shadow-lime-sm scale-105'
                                : 'bg-white/10 hover:bg-white/15 text-slate-400 hover:text-white border border-white/10'
                            }`}
                            title={set.isCompleted ? 'Mark incomplete' : 'Complete set & start rest timer'}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>

                          {currentExercise.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSet(activeExerciseIndex, setIdx)}
                              className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                              title="Delete Set"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* MOBILE DEDICATED SET CARDS (Optimized for iPhone with Number Keypad) */}
                  <div className="sm:hidden space-y-2.5">
                    {currentExercise.sets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        className={`p-3 rounded-2xl border transition-all ${
                          set.isCompleted
                            ? 'bg-lime/10 border-lime/40 shadow-lime-sm'
                            : 'bg-[#0a0d14]/90 border-white/10'
                        }`}
                      >
                        {/* Set Header Bar with Entry Timestamp */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                                set.isCompleted
                                  ? 'bg-lime text-dark-950 font-black'
                                  : 'bg-white/10 text-white'
                              }`}
                            >
                              Set #{set.setNumber}
                            </span>

                            {set.completedAt && (
                              <span className="text-[10px] text-lime font-mono font-semibold">
                                ✓ Logged {new Date(set.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <select
                              value={set.support || 'normal'}
                              onChange={(e) =>
                                handleUpdateSetValue(
                                  activeExerciseIndex,
                                  setIdx,
                                  'support',
                                  e.target.value
                                )
                              }
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-300 focus:outline-none focus:border-lime capitalize"
                            >
                              <option value="normal">Normal</option>
                              <option value="warmup">Warmup</option>
                              <option value="drop_set">Drop Set</option>
                              <option value="assisted">Spotter</option>
                              <option value="failure">To Failure</option>
                            </select>

                            {currentExercise.sets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSet(activeExerciseIndex, setIdx)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                                title="Delete Set"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Set Inputs & Circular Log Button */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          {/* Weight input - Direct decimal keypad, no stuck 0 */}
                          <div className="col-span-4">
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                              Weight ({unit})
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*[.,]?[0-9]*"
                              value={set.weightKg === 0 || set.weightKg === '0' ? '' : set.weightKg}
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = e.target.value.replace(',', '.');
                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                  handleUpdateSetValue(
                                    activeExerciseIndex,
                                    setIdx,
                                    'weightKg',
                                    val === '' ? 0 : val
                                  );
                                }
                              }}
                              className="w-full bg-white/5 border border-white/15 rounded-xl px-2 py-2 text-sm text-white font-mono font-bold text-center focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime"
                            />
                          </div>

                          {/* Reps input - Direct numeric keypad, no stuck 0 */}
                          <div className="col-span-4">
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                              Reps
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={set.reps === 0 || set.reps === '0' ? '' : set.reps}
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d*$/.test(val)) {
                                  handleUpdateSetValue(
                                    activeExerciseIndex,
                                    setIdx,
                                    'reps',
                                    val === '' ? 0 : val
                                  );
                                }
                              }}
                              className="w-full bg-white/5 border border-white/15 rounded-xl px-2 py-2 text-sm text-white font-mono font-bold text-center focus:outline-none focus:border-lime focus:ring-1 focus:ring-lime"
                            />
                          </div>

                          {/* Tactile Big Log Button */}
                          <div className="col-span-4 flex flex-col items-center justify-center">
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                              Log &amp; Rest
                            </label>
                            <button
                              type="button"
                              onClick={() => handleToggleSetComplete(activeExerciseIndex, setIdx)}
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center active:scale-90 transition-all ${
                                set.isCompleted
                                  ? 'bg-lime text-dark-950 shadow-lime-sm'
                                  : 'bg-white/10 hover:bg-white/15 text-slate-400 border border-white/15'
                              }`}
                              title={set.isCompleted ? 'Mark incomplete' : 'Complete set & start rest timer'}
                            >
                              <Check className="w-5 h-5 stroke-[3]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Set Button */}
                  <button
                    type="button"
                    onClick={() => handleAddSetToExercise(activeExerciseIndex)}
                    className="w-full py-2.5 rounded-2xl text-xs font-bold text-lime bg-lime/10 hover:bg-lime/15 border border-dashed border-lime/30 flex items-center justify-center gap-1.5 transition-colors active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Set #{currentExercise.sets.length + 1}</span>
                  </button>
                </div>

                {/* Movement Navigation */}
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={activeExerciseIndex === 0}
                    onClick={() => setActiveExerciseIndex((prev) => Math.max(0, prev - 1))}
                  >
                    Previous
                  </Button>

                  {activeExerciseIndex < exercises.length - 1 ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveExerciseIndex((prev) => prev + 1)}
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                    >
                      Next Movement
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setIsFinishModalOpen(true)}
                      rightIcon={<Award className="w-4 h-4" />}
                    >
                      Finish Session
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Muscle Aiming Body Silhouette for current exercise */}
            {currentExercise && (
              <BodyTargetDiagram
                targetedMuscles={targetMuscles}
                activeExerciseMuscle={currentExercise.muscle}
              />
            )}

            {/* Discard Workout Option */}
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => setIsDiscardModalOpen(true)}
                className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
              >
                Discard workout session
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Apple-Style Rest & Wait Timer HUD Overlay */}
      {isRestTimerActive && (
        <AppleRestTimer
          durationSec={restDurationSec}
          title={restTimerTitle}
          autoStart={restTimerAutoStart}
          onFinish={handleCloseRestTimer}
          onDismiss={handleCloseRestTimer}
          nextExerciseName={currentExercise?.name}
          nextSetNumber={
            (currentExercise?.sets.findIndex((s) => !s.isCompleted) ?? 0) + 1 ||
            currentExercise?.sets.length
          }
        />
      )}

      {/* Movement Variation Picker Modal */}
      <ExerciseVariationPicker
        isOpen={isVariationPickerOpen}
        onClose={() => setIsVariationPickerOpen(false)}
        initialMuscle={pickerTargetMuscle}
        onSelectVariation={handleSelectVariation}
      />

      {/* Finish Session Confirmation Modal */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in select-none">
          <div className="w-full max-w-[360px] sm:max-w-md rounded-[32px] bg-[#07090f]/95 border border-white/10 p-5 sm:p-7 text-center shadow-2xl space-y-4 backdrop-filter backdrop-blur-3xl">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-lime/15 border border-lime/30 flex items-center justify-center text-lime mx-auto shadow-lime-sm">
              <Award className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Finish {sessionTitle}?
            </h2>
            <p className="text-xs text-slate-400">
              Outstanding training today! Summary of logged volume and sets:
            </p>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Time</span>
                <span className="text-sm sm:text-base font-extrabold text-white font-mono mt-0.5">
                  {formatStopwatch(elapsedSeconds)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Volume</span>
                <span className="text-sm sm:text-base font-extrabold text-lime font-mono mt-0.5">
                  {totalVolume.toLocaleString()} {unit}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Sets</span>
                <span className="text-sm sm:text-base font-extrabold text-orange-400 font-mono mt-0.5">
                  {completedSetsCount} sets
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsFinishModalOpen(false)}
                disabled={isSaving}
              >
                Keep Training
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveAndCompleteSession}
                isLoading={isSaving}
                rightIcon={<Check className="w-4 h-4" />}
              >
                Save Workout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      {isDiscardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in select-none">
          <div className="w-full max-w-[340px] rounded-[30px] bg-[#07090f]/95 border border-rose-500/30 p-5 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Discard Workout?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to discard this workout? Current sets and timing will not be saved.
            </p>
            <div className="flex items-center justify-between gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsDiscardModalOpen(false)}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors"
              >
                Yes, Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
