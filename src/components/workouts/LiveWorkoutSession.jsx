import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  RotateCcw,
  Sparkles,
  Minimize2,
  ChevronDown,
  Layers,
  Calendar as CalendarIcon,
  Timer,
  Pause,
  Play,
} from 'lucide-react';

export const LiveWorkoutSession = ({ isOpen, onClose, onWorkoutSaved }) => {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();

  const unit = profile?.unit_system === 'imperial' ? 'lbs' : 'kg';

  // 1. Auto-detected Date, Day, Start Time
  const [startTime] = useState(() => new Date());
  const dateFormatted = startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const dayOfWeek = startTime.toLocaleDateString('en-US', { weekday: 'long' });
  const startTimeFormatted = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // 2. Setup Step: Routine / Workout of the Day & Target Muscles
  const [isSetupDone, setIsSetupDone] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState('chest_triceps');
  const [targetMuscles, setTargetMuscles] = useState(['chest', 'triceps']);
  const [sessionTitle, setSessionTitle] = useState('Chest & Triceps Hypertrophy');

  // 3. Exercise Flow state
  const [exercises, setExercises] = useState([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);

  // 4. Stopwatch timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 5. Apple Rest & Wait Timer state
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [restDurationSec, setRestDurationSec] = useState(90);
  const [restTimerTitle, setRestTimerTitle] = useState('Rest & Recovery');
  const [restTimerAutoStart, setRestTimerAutoStart] = useState(true);

  // 6. Variation Picker Modal
  const [isVariationPickerOpen, setIsVariationPickerOpen] = useState(false);
  const [pickerTargetMuscle, setPickerTargetMuscle] = useState('chest');

  // 7. Finish confirmation modal
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Live stopwatch effect
  useEffect(() => {
    if (!isOpen || isPaused) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isPaused]);

  // When routine changes during setup, update target muscles and default title
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

  // Launch exercises from selected target muscles
  const handleConfirmSetup = (withPrepCountdown = false) => {
    if (targetMuscles.length === 0) {
      toastError('Please select at least one target muscle group.');
      return;
    }

    // Populate initial exercise for each selected muscle
    const initialExercises = targetMuscles.map((muscle) => {
      const available = EXERCISE_VARIATIONS_BY_MUSCLE[muscle] || [];
      const firstVar = available[0] || {
        name: `${muscle.toUpperCase()} Press`,
        target: `${muscle.toUpperCase()} Hypertrophy`,
        tips: ['Focus on controlled tempo and full range of motion.'],
        defaultRestSec: 90,
      };

      return {
        muscle,
        name: firstVar.name,
        target: firstVar.target,
        tips: firstVar.tips || [],
        image: firstVar.image || null,
        defaultRestSec: firstVar.defaultRestSec || 90,
        sets: [
          { setNumber: 1, weightKg: 60, reps: 10, support: 'warmup', isCompleted: false },
          { setNumber: 2, weightKg: 80, reps: 8, support: 'normal', isCompleted: false },
          { setNumber: 3, weightKg: 80, reps: 8, support: 'normal', isCompleted: false },
        ],
      };
    });

    setExercises(initialExercises);
    setActiveExerciseIndex(0);
    setIsSetupDone(true);

    if (withPrepCountdown) {
      handleOpenRestTimer(10, 'Get Ready! 10s Prep Countdown', true);
    }
  };

  // Helper calculations
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

  const formatStopwatch = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Dedicated Open Rest / Wait Timer handler
  const handleOpenRestTimer = useCallback((duration = 90, title = 'Rest & Recovery', autoStart = false) => {
    setRestDurationSec(duration);
    setRestTimerTitle(title);
    setRestTimerAutoStart(autoStart);
    setIsRestTimerActive(true);
  }, []);

  const handleCloseRestTimer = useCallback(() => {
    setIsRestTimerActive(false);
  }, []);

  // Set updates
  const handleToggleSetComplete = (exIdx, setIdx) => {
    setExercises((prev) => {
      const copy = [...prev];
      const targetSet = copy[exIdx].sets[setIdx];
      const willBeCompleted = !targetSet.isCompleted;
      targetSet.isCompleted = willBeCompleted;

      if (willBeCompleted) {
        playSetCompleteSound();
        // Trigger Apple Rest Timer with clean state
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

  // Switch exercise variation
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

  // Add brand new exercise tab
  const handleAddNewExerciseMovement = () => {
    setPickerTargetMuscle(targetMuscles[0] || 'chest');
    setIsVariationPickerOpen(true);
  };

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
        category: 'strength',
        targetMuscles,
        dayOfWeek,
        durationMinutes: durationMins,
        startedAt: startTime.toISOString(),
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
          })),
        })),
      };

      const { error } = await workoutService.createWorkout(user.id, payload);
      if (error) {
        toastError(error.message || 'Failed to save session to MongoDB.');
      } else {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#22c55e', '#bbf43d', '#ff9500', '#38bdf8'],
        });
        success(`Workout finished! Total Volume: ${totalVolume.toLocaleString()} ${unit}`);
        if (onWorkoutSaved) onWorkoutSaved();
        onClose();
      }
    } catch (err) {
      toastError(err?.message || 'Error saving workout session.');
    } finally {
      setIsSaving(false);
      setIsFinishModalOpen(false);
    }
  };

  if (!isOpen) return null;

  const currentExercise = exercises[activeExerciseIndex];

  return (
    <div className="fixed inset-0 z-50 bg-[#04060a] text-white flex flex-col overflow-y-auto no-scrollbar animate-in fade-in select-none">
      {/* iOS 26 Glass Top Navigation & Dynamic HUD */}
      <header className="sticky top-0 z-30 bg-[#07090f]/85 backdrop-blur-3xl border-b border-white/[0.08] px-3 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 transition-all">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Auto Day & Time Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.25)] shrink-0">
              <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 truncate">
                  Live
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate">• {dayOfWeek}</span>
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
                <span className="text-base font-black text-emerald-400 font-mono">
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
            {/* Direct Rest / Wait Timer Header Trigger */}
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
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-orange-500/15 hover:bg-orange-500/25 active:scale-95 border border-orange-500/35 text-orange-400 text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,149,0,0.2)]"
                title="Open Rest & Wait Counter"
              >
                <Timer className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs">Rest Timer</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-colors"
              title="Minimize Session"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {isSetupDone && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsFinishModalOpen(true)}
                className="text-xs px-2.5 sm:px-3"
              >
                Finish
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* ================= STEP 1: SETUP SCREEN ================= */}
        {!isSetupDone ? (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in">
            {/* Auto Time Stamp Strip */}
            <div className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">
                  Date: <strong className="text-white">{dateFormatted}</strong> ({dayOfWeek})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-slate-300">
                  Auto Start: <strong className="text-white">{startTimeFormatted}</strong>
                </span>
              </div>
            </div>

            {/* Workout of the Day Dropdown */}
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-4 sm:p-6 space-y-3 backdrop-blur-xl shadow-xl">
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                  1. Workout of the Day (Routine Split)
                </label>
                <p className="text-xs text-slate-400">
                  Select your workout split. FitTrack will automatically configure target muscles and exercises.
                </p>
              </div>

              <div className="relative">
                <select
                  value={selectedRoutineId}
                  onChange={(e) => handleRoutineChange(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-white/15 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-400 appearance-none pr-10 cursor-pointer"
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

            {/* Multi-Select Muscle Target Zone */}
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-4 sm:p-6 space-y-4 backdrop-blur-xl shadow-xl">
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                  2. Targeted Muscles (Multi-Select)
                </label>
                <p className="text-xs text-slate-400">
                  Tap to add or remove muscle groups aiming to be trained today.
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
                      className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-500 text-dark-950 shadow-[0_0_12px_rgba(34,197,94,0.35)] scale-105'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                      }`}
                    >
                      <span>{m.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Anatomical Human Body Diagram with Highlights */}
              <BodyTargetDiagram targetedMuscles={targetMuscles} />
            </div>

            {/* Start Session CTA Buttons: Instant or with 10s Prep Countdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmSetup(true)}
                className="px-4 py-3 rounded-2xl bg-orange-500/15 hover:bg-orange-500/25 active:scale-95 text-orange-400 border border-orange-500/35 font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,149,0,0.18)] transition-all"
              >
                <Timer className="w-4 h-4 animate-pulse" />
                <span>Start with 10s Prep Wait Counter</span>
              </button>

              <Button
                variant="primary"
                size="lg"
                onClick={() => handleConfirmSetup(false)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Begin Active Training Session
              </Button>
            </div>
          </div>
        ) : (
          /* ================= STEP 2: ACTIVE EXERCISE SESSION FLOW ================= */
          <div className="space-y-4 sm:space-y-6 animate-in fade-in pb-10">
            {/* Mobile Top Stats Bar (Optimized for iPhone 12 Mini) */}
            <div className="sm:hidden grid grid-cols-4 gap-1.5 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center text-xs backdrop-blur-xl">
              <div className="p-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Time</span>
                <span className="font-extrabold text-white font-mono text-xs">{formatStopwatch(elapsedSeconds)}</span>
              </div>
              <div className="p-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Volume</span>
                <span className="font-extrabold text-emerald-400 font-mono text-xs">
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
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {exercises.map((ex, idx) => {
                const isActive = activeExerciseIndex === idx;
                const completedSets = ex.sets.filter((s) => s.isCompleted).length;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveExerciseIndex(idx)}
                    className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                      isActive
                        ? 'bg-emerald-500 text-dark-950 shadow-[0_0_15px_rgba(34,197,94,0.35)] scale-105'
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
                className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-dashed border-emerald-500/30 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Movement</span>
              </button>
            </div>

            {/* Current Active Movement Focus Card */}
            {currentExercise && (
              <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-4 sm:p-7 space-y-5 backdrop-blur-2xl shadow-2xl">
                {/* Movement Header + Variation Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
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

                  {/* Quick Action Buttons: Switch Variation & Manual Rest Timer */}
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
                      <span>Rest Timer ({currentExercise.defaultRestSec || 90}s)</span>
                    </button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setPickerTargetMuscle(currentExercise.muscle);
                        setIsVariationPickerOpen(true);
                      }}
                      leftIcon={<Layers className="w-3.5 h-3.5 text-emerald-400" />}
                    >
                      Switch
                    </Button>
                  </div>
                </div>

                {/* Form Tips & Demonstration Photo Card */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#090c13]/80 border border-white/5 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
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

                {/* Sets & Load Entries */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Sets &amp; Load Entries
                    </h3>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Timer className="w-3 h-3 text-orange-400" />
                      <span>Standard Rest: {currentExercise.defaultRestSec || 90}s</span>
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
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-white/[0.03] border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="col-span-2 flex items-center gap-1.5">
                          <span
                            className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                              set.isCompleted ? 'bg-emerald-500 text-dark-950 font-black' : 'bg-white/10 text-slate-300'
                            }`}
                          >
                            #{set.setNumber}
                          </span>
                        </div>

                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.5"
                            value={set.weightKg}
                            onChange={(e) =>
                              handleUpdateSetValue(
                                activeExerciseIndex,
                                setIdx,
                                'weightKg',
                                Number(e.target.value)
                              )
                            }
                            className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-emerald-400"
                            placeholder="0"
                          />
                        </div>

                        <div className="col-span-3">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              handleUpdateSetValue(
                                activeExerciseIndex,
                                setIdx,
                                'reps',
                                Number(e.target.value)
                              )
                            }
                            className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-emerald-400"
                            placeholder="10"
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
                            className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-1.5 py-1.5 text-[10px] font-bold text-slate-300 focus:outline-none focus:border-emerald-400 capitalize"
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
                                ? 'bg-emerald-500 text-dark-950 shadow-[0_0_12px_rgba(34,197,94,0.35)] scale-105'
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

                  {/* MOBILE DEDICATED SET CARDS (iPhone 12 Mini & Compact Screens) */}
                  <div className="sm:hidden space-y-2.5">
                    {currentExercise.sets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        className={`p-3 rounded-2xl border transition-all ${
                          set.isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                            : 'bg-[#0a0d14]/90 border-white/10'
                        }`}
                      >
                        {/* Set Header Bar */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                                set.isCompleted
                                  ? 'bg-emerald-500 text-dark-950 font-black'
                                  : 'bg-white/10 text-white'
                              }`}
                            >
                              Set #{set.setNumber}
                            </span>

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
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-300 focus:outline-none focus:border-emerald-400 capitalize"
                            >
                              <option value="normal">Normal</option>
                              <option value="warmup">Warmup</option>
                              <option value="drop_set">Drop Set</option>
                              <option value="assisted">Spotter</option>
                              <option value="failure">To Failure</option>
                            </select>
                          </div>

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

                        {/* Set Inputs & Circular Log Button */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          {/* Weight input */}
                          <div className="col-span-4">
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                              Weight ({unit})
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={set.weightKg}
                              onChange={(e) =>
                                handleUpdateSetValue(
                                  activeExerciseIndex,
                                  setIdx,
                                  'weightKg',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full bg-white/5 border border-white/15 rounded-xl px-2 py-2 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-emerald-400"
                              placeholder="0"
                            />
                          </div>

                          {/* Reps input */}
                          <div className="col-span-4">
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                              Reps
                            </label>
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) =>
                                handleUpdateSetValue(
                                  activeExerciseIndex,
                                  setIdx,
                                  'reps',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full bg-white/5 border border-white/15 rounded-xl px-2 py-2 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-emerald-400"
                              placeholder="10"
                            />
                          </div>

                          {/* 44x44px Tactile iOS Circular Log / Check Button */}
                          <div className="col-span-4 flex flex-col items-center justify-center">
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                              Log &amp; Rest
                            </label>
                            <button
                              type="button"
                              onClick={() => handleToggleSetComplete(activeExerciseIndex, setIdx)}
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center active:scale-90 transition-all ${
                                set.isCompleted
                                  ? 'bg-emerald-500 text-dark-950 shadow-[0_0_16px_rgba(34,197,94,0.45)]'
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
                    className="w-full py-2.5 rounded-2xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-dashed border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Set #{currentExercise.sets.length + 1}</span>
                  </button>
                </div>

                {/* Navigation between exercises */}
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
          <div className="w-full max-w-[360px] sm:max-w-md rounded-[32px] bg-[#07090f]/90 border border-white/10 p-5 sm:p-7 text-center shadow-2xl space-y-4 backdrop-filter backdrop-blur-3xl">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <Award className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Finish {sessionTitle}?
            </h2>
            <p className="text-xs text-slate-400">
              Outstanding effort today! Here is your workout session performance summary:
            </p>

            {/* Performance Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Time</span>
                <span className="text-sm sm:text-base font-extrabold text-white font-mono mt-0.5">
                  {formatStopwatch(elapsedSeconds)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Volume</span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono mt-0.5">
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
    </div>
  );
};
