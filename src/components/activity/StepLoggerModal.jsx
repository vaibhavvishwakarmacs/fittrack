import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { activityService } from '../../services/activityService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateToISO } from '../../lib/utils';
import { Footprints } from 'lucide-react';

export const StepLoggerModal = ({
  isOpen,
  onClose,
  onActivitySaved,
  defaultDate,
  initialSteps = 0,
}) => {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();

  const [date, setDate] = useState(defaultDate || formatDateToISO());
  const [steps, setSteps] = useState(initialSteps);
  const [distanceKm, setDistanceKm] = useState('');
  const [activeCalories, setActiveCalories] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unit = profile?.unit_system === 'imperial' ? 'miles' : 'km';

  const handleStepChange = (val) => {
    const s = Math.max(0, val);
    setSteps(s);
    setDistanceKm(Math.round(s * 0.00075 * 100) / 100);
    setActiveCalories(Math.round(s * 0.04));
    setDurationMinutes(Math.round(s / 100));
  };

  const handleAddSteps = (add) => {
    handleStepChange(steps + add);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toastError('Please sign in to record activity.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await activityService.upsertActivity(user.id, {
        date,
        steps: Number(steps) || 0,
        distanceKm: distanceKm === '' ? undefined : Number(distanceKm),
        activeCalories: activeCalories === '' ? undefined : Number(activeCalories),
        durationMinutes: durationMinutes === '' ? undefined : Number(durationMinutes),
        notes: notes.trim(),
      });

      if (error) {
        toastError(error.message || 'Failed to save activity log.');
      } else {
        success(`Saved ${Number(steps).toLocaleString()} steps for ${date}`);
        onActivitySaved();
        onClose();
      }
    } catch (err) {
      toastError(err?.message || 'Error updating steps');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Daily Steps &amp; Activity"
      description="Update your daily walking, cardio distance, and active calorie burn"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <div>
          <Input
            label="Total Steps for the Day"
            type="number"
            value={steps || ''}
            onChange={(e) => handleStepChange(Number(e.target.value))}
            leftIcon={<Footprints className="w-4 h-4 text-lime" />}
            placeholder="e.g. 8500"
            required
          />

          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[1000, 2500, 5000, 10000].map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => handleAddSteps(inc)}
                className="py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-white/5 text-[11px] font-bold text-slate-300 hover:text-lime transition-colors"
              >
                +{inc >= 1000 ? `${inc / 1000}k` : inc}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Input
            label={`Dist (${unit})`}
            type="number"
            step="0.01"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="5.2"
          />
          <Input
            label="Burn (kcal)"
            type="number"
            value={activeCalories}
            onChange={(e) => setActiveCalories(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="340"
          />
          <Input
            label="Time (min)"
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="50"
          />
        </div>

        <Input
          label="Activity Notes (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Evening brisk walk in the park"
        />

        <div className="pt-2 flex justify-between items-center">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Activity
          </Button>
        </div>
      </form>
    </Modal>
  );
};
