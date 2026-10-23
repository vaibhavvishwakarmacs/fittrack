import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ExercisePickerModal } from './ExercisePickerModal';
import { workoutService } from '../../services/workoutService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Plus,
  Trash2,
  Check,
  Dumbbell,
  Clock,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const WorkoutLoggerModal = ({
  isOpen,
  onClose,
  onWorkoutSaved,
}) => {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();

  const [title, setTitle] = useState('Upper Body Hypertrophy');
  const [category, setCategory] = useState('hypertrophy');
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const [exercises, setExercises] = useState([
    {
      name: 'Barbell Bench Press',
      category: 'chest',
      sets: [
        { setNumber: 1, weightKg: 60, reps: 10, rpe: 7, isCompleted: true },
        { setNumber: 2, weightKg: 70, reps: 8, rpe: 8, isCompleted: true },
        { setNumber: 3, weightKg: 70, reps: 8, rpe: 8.5, isCompleted: true },
      ],
    },
    {
      name: 'Barbell Bent-Over Row',
      category: 'back',
      sets: [
        { setNumber: 1, weightKg: 60, reps: 10, rpe: 7.5, isCompleted: true },
        { setNumber: 2, weightKg: 65, reps: 8, rpe: 8, isCompleted: true },
      ],
    },
  ]);

  const unit = profile?.unit_system === 'imperial' ? 'lbs' : 'kg';

  const totalVolume = exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((setAcc, s) => {
        return s.isCompleted ? setAcc + (s.weightKg || 0) * (s.reps || 0) : setAcc;
      }, 0)
    );
  }, 0);

  const handleAddExercise = (name, cat) => {
    setExercises((prev) => [
      ...prev,
      {
        name,
        category: cat,
        sets: [{ setNumber: 1, weightKg: 50, reps: 10, rpe: 8, isCompleted: true }],
      },
    ]);
  };

  const handleRemoveExercise = (idx) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddSet = (exIdx) => {
    setExercises((prev) => {
      const copy = [...prev];
      const target = copy[exIdx];
      const lastSet = target.sets[target.sets.length - 1];
      target.sets.push({
        setNumber: target.sets.length + 1,
        weightKg: lastSet ? lastSet.weightKg : 50,
        reps: lastSet ? lastSet.reps : 10,
        rpe: lastSet ? lastSet.rpe : 8,
        isCompleted: true,
      });
      return copy;
    });
  };

  const handleRemoveSet = (exIdx, setIdx) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[exIdx].sets = copy[exIdx].sets
        .filter((_, s) => s !== setIdx)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      return copy;
    });
  };

  const handleUpdateSet = (exIdx, setIdx, field, value) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[exIdx].sets[setIdx] = {
        ...copy[exIdx].sets[setIdx],
        [field]: value,
      };
      return copy;
    });
  };

  const handleSaveWorkout = async () => {
    if (!user) {
      toastError('You must be signed in to log workouts.');
      return;
    }
    if (!title.trim()) {
      toastError('Please enter a workout title.');
      return;
    }
    if (exercises.length === 0) {
      toastError('Please add at least one exercise to your workout.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        durationMinutes: Number(durationMinutes) || 45,
        notes: notes.trim(),
        exercises: exercises.map((ex) => ({
          name: ex.name,
          category: ex.category,
          notes: ex.notes,
          sets: ex.sets.map((s) => ({
            setNumber: s.setNumber,
            reps: Number(s.reps) || 0,
            weightKg: Number(s.weightKg) || 0,
            rpe: s.rpe ? Number(s.rpe) : null,
            isCompleted: s.isCompleted,
          })),
        })),
      };

      const { error } = await workoutService.createWorkout(user.id, payload);
      if (error) {
        toastError(error.message || 'Failed to save workout session.');
      } else {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#bbf43d', '#ccff00', '#38bdf8', '#ffffff'],
        });
        success(`Workout "${title}" saved! Total Volume: ${totalVolume} ${unit}`);
        onWorkoutSaved();
        onClose();
      }
    } catch (err) {
      toastError(err?.message || 'Error recording workout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Log Workout Session"
        description="Record movements, sets, load, and perceived effort"
        maxWidth="xl"
      >
        <div className="space-y-5 text-left">
          {/* General Workout Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Workout Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Heavy Leg Day"
            />
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Workout Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-lime"
              >
                <option value="strength">Strength</option>
                <option value="hypertrophy">Hypertrophy</option>
                <option value="cardio">Cardio</option>
                <option value="hiit">HIIT</option>
                <option value="flexibility">Flexibility / Yoga</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Duration (minutes)"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              leftIcon={<Clock className="w-4 h-4 text-sky-400" />}
            />
            <Input
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="RPE 8.5, good shoulder pump"
            />
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-dark-950 border border-white/10 text-center">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Volume</p>
              <p className="text-sm sm:text-base font-extrabold text-lime mt-0.5">
                {totalVolume.toLocaleString()} {unit}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Est. Burn</p>
              <p className="text-sm sm:text-base font-extrabold text-amber-400 mt-0.5">
                {Math.round(durationMinutes * 6.5)} kcal
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Exercises</p>
              <p className="text-sm sm:text-base font-extrabold text-sky-400 mt-0.5">
                {exercises.length}
              </p>
            </div>
          </div>

          {/* Exercise Builder Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-lime" />
                <span>Exercises &amp; Sets</span>
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPickerOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Exercise
              </Button>
            </div>

            {exercises.map((ex, exIdx) => (
              <div
                key={exIdx}
                className="p-4 rounded-2xl bg-dark-850/80 border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-lime/20 text-lime text-xs font-bold flex items-center justify-center">
                      {exIdx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white tracking-tight">{ex.name}</h4>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                      {ex.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Remove Exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sets Table Header */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-slate-400 uppercase px-1">
                  <span className="col-span-2">Set</span>
                  <span className="col-span-3">Weight ({unit})</span>
                  <span className="col-span-3">Reps</span>
                  <span className="col-span-2">RPE</span>
                  <span className="col-span-2 text-right">Done</span>
                </div>

                {/* Sets Rows */}
                <div className="space-y-2">
                  {ex.sets.map((s, sIdx) => (
                    <div
                      key={sIdx}
                      className="grid grid-cols-12 gap-2 items-center bg-dark-900 p-2 rounded-xl border border-white/5"
                    >
                      <span className="col-span-2 text-xs font-bold text-slate-300">
                        #{s.setNumber}
                      </span>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.5"
                          value={s.weightKg}
                          onChange={(e) =>
                            handleUpdateSet(exIdx, sIdx, 'weightKg', Number(e.target.value))
                          }
                          className="w-full bg-dark-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-lime"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={s.reps}
                          onChange={(e) =>
                            handleUpdateSet(exIdx, sIdx, 'reps', Number(e.target.value))
                          }
                          className="w-full bg-dark-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-lime"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="10"
                          placeholder="8"
                          value={s.rpe ?? ''}
                          onChange={(e) =>
                            handleUpdateSet(
                              exIdx,
                              sIdx,
                              'rpe',
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="w-full bg-dark-950 border border-white/10 rounded-lg px-1.5 py-1 text-xs text-white text-center focus:outline-none focus:border-lime placeholder-slate-600"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateSet(exIdx, sIdx, 'isCompleted', !s.isCompleted)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            s.isCompleted
                              ? 'bg-lime text-dark-950'
                              : 'bg-dark-800 text-slate-500 border border-white/10'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        {ex.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exIdx, sIdx)}
                            className="text-slate-600 hover:text-rose-400 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddSet(exIdx)}
                  className="w-full py-1.5 text-xs font-semibold text-lime hover:bg-lime/10 rounded-xl border border-dashed border-lime/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Set</span>
                </button>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              onClick={handleSaveWorkout}
              rightIcon={<Award className="w-4 h-4" />}
            >
              Complete &amp; Save Workout
            </Button>
          </div>
        </div>
      </Modal>

      <ExercisePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectExercise={handleAddExercise}
      />
    </>
  );
};
