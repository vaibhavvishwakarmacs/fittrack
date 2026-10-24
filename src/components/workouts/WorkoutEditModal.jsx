import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Dumbbell, Clock } from 'lucide-react';
import { workoutService } from '../../services/workoutService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export const WorkoutEditModal = ({
  isOpen,
  onClose,
  workout,
  onWorkoutUpdated,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('strength');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workout) {
      setTitle(workout.title || '');
      setCategory(workout.category || 'strength');
      setDurationMinutes(workout.duration_minutes || workout.durationMinutes || 45);
      setNotes(workout.notes || '');
    }
  }, [workout, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !workout) return;

    if (!title.trim()) {
      toastError('Workout title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await workoutService.updateWorkout(user.id, workout.id, {
        title: title.trim(),
        category,
        durationMinutes: Number(durationMinutes) || 45,
        notes: notes.trim() || null,
      });

      if (error) {
        toastError(error.message || 'Failed to update workout');
      } else {
        success(`Updated workout "${title}"`);
        onWorkoutUpdated();
        onClose();
      }
    } catch (err) {
      toastError(err?.message || 'Error updating workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Workout Session"
      description="Update session title, category, training duration or notes"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <Input
            label="Workout Title"
            placeholder="e.g. Chest & Triceps Hypertrophy"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            leftIcon={<Dumbbell className="w-4 h-4 text-lime" />}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-lime"
            >
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy</option>
              <option value="cardio">Cardio</option>
              <option value="hiit">HIIT</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <Input
              label="Duration (min)"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              leftIcon={<Clock className="w-4 h-4 text-sky-400" />}
              min="1"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
            Notes / Reflections
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Felt strong on incline bench, rest intervals stayed under 90s..."
            rows={3}
            className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime"
          />
        </div>

        <div className="pt-2 flex justify-between items-center">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="font-bold shadow-lime-sm"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
