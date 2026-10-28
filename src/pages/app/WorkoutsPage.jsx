import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useWorkoutSession } from '../../contexts/WorkoutSessionContext';
import { workoutService } from '../../services/workoutService';
import { fastCache } from '../../lib/cache';
import { WorkoutCard } from '../../components/workouts/WorkoutCard';
import { WorkoutEditModal } from '../../components/workouts/WorkoutEditModal';
import { MasterMovementLibraryModal } from '../../components/workouts/MasterMovementLibraryModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { WorkoutsSkeleton } from '../../components/common/Skeleton';
import { ShareCardModal } from '../../components/common/ShareCardModal';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Dumbbell, Plus, Clock, Trophy, Layers } from 'lucide-react';

export const WorkoutsPage = () => {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();
  const { startSession, hasActiveSavedSession } = useWorkoutSession();

  // Instant SWR state: populate synchronously from cache (0ms loading)
  const cachedWorkouts = user ? fastCache.get(`workouts:${user.id}`) : null;
  const [workouts, setWorkouts] = useState(cachedWorkouts || []);
  const [isLoading, setIsLoading] = useState(!cachedWorkouts);
  const [filter, setFilter] = useState('all');

  // Modals state
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sharingWorkout, setSharingWorkout] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMasterLibraryOpen, setIsMasterLibraryOpen] = useState(false);

  const unit = profile?.unit_system === 'imperial' ? 'lbs' : 'kg';

  const loadWorkouts = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await workoutService.getWorkouts(user.id);
      setWorkouts(data || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const handleConfirmDelete = async () => {
    if (!user || !deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await workoutService.deleteWorkout(user.id, deleteTarget.id);
      if (error) {
        toastError(error.message || 'Failed to delete workout');
      } else {
        success(`Deleted workout "${deleteTarget.title}"`);
        setDeleteTarget(null);
        loadWorkouts();
      }
    } catch (err) {
      toastError(err?.message || 'Error deleting workout');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats calculation
  const totalVolume = workouts.reduce((acc, w) => acc + (w.total_volume_kg || w.totalVolumeKg || 0), 0);
  const totalMinutes = workouts.reduce((acc, w) => acc + (w.duration_minutes || w.durationMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const filteredWorkouts = workouts.filter((w) => {
    if (filter === 'all') return true;
    return w.category === filter;
  });

  const categories = [
    { id: 'all', label: 'All Workouts' },
    { id: 'strength', label: 'Strength' },
    { id: 'hypertrophy', label: 'Hypertrophy' },
    { id: 'cardio', label: 'Cardio' },
    { id: 'hiit', label: 'HIIT' },
  ];

  // Sleek Skeleton state instead of blank spinner
  if (isLoading && workouts.length === 0) {
    return <WorkoutsSkeleton />;
  }

  return (
    <div className="space-y-4 text-left animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-lime" />
            <span>Workout Journal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log exercises, track volume progression, and beat personal records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsMasterLibraryOpen(true)}
            leftIcon={<Layers className="w-4 h-4 text-lime" />}
            className="font-bold border border-white/10"
          >
            Movement Library
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => startSession(loadWorkouts)}
            leftIcon={<Dumbbell className="w-4 h-4" />}
            className="font-bold shadow-lime-sm"
          >
            {hasActiveSavedSession ? 'Resume Live Workout' : 'Start Workout Session'}
          </Button>
        </div>
      </div>

      {/* Aggregate Stats Banner */}
      <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Sessions</p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <Trophy className="w-3.5 h-3.5 text-lime" />
            <span className="text-base sm:text-lg font-black text-white font-sans">{workouts.length}</span>
          </div>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Volume Moved</p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <Dumbbell className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-base sm:text-lg font-black text-white font-sans">
              {Math.round(totalVolume).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{unit}</span>
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Training Time</p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-base sm:text-lg font-black text-white font-sans">
              {totalHours} <span className="text-[10px] font-normal text-slate-400">hrs</span>
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === cat.id
                ? 'bg-lime text-dark-950 font-bold shadow-lime-sm'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Workout Sessions List */}
      <div className="space-y-3">
        {filteredWorkouts.length > 0 ? (
          filteredWorkouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              unit={unit}
              onEdit={(target) => setEditingWorkout(target)}
              onDelete={(target) => setDeleteTarget(target)}
              onShare={(target) => setSharingWorkout(target)}
            />
          ))
        ) : (
          <EmptyState
            icon={<Dumbbell className="w-8 h-8" />}
            title={filter === 'all' ? 'No workouts logged yet' : `No ${filter} workouts found`}
            description="Hit the gym or start home training. Record your sets, reps, and weights in real-time."
            actionLabel="Start Live Workout Session"
            actionIcon={<Plus className="w-4 h-4" />}
            onAction={() => startSession(loadWorkouts)}
          />
        )}
      </div>

      {/* Edit Workout Modal */}
      <WorkoutEditModal
        isOpen={Boolean(editingWorkout)}
        onClose={() => setEditingWorkout(null)}
        workout={editingWorkout}
        onWorkoutUpdated={loadWorkouts}
      />

      {/* Confirmation Modal on Delete */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Workout Session"
        itemName={deleteTarget?.title}
        message="Are you sure you want to delete this completed workout? All recorded sets and volume will be removed."
        isDeleting={isDeleting}
      />

      {/* Share Workout Card Modal */}
      <ShareCardModal
        isOpen={Boolean(sharingWorkout)}
        onClose={() => setSharingWorkout(null)}
        type="workout"
        unit={unit}
        data={sharingWorkout ? {
          title: sharingWorkout.title,
          category: sharingWorkout.category,
          duration_minutes: sharingWorkout.duration_minutes || sharingWorkout.durationMinutes,
          total_volume_kg: sharingWorkout.total_volume_kg || sharingWorkout.totalVolumeKg,
          calories_burned: sharingWorkout.calories_burned || sharingWorkout.caloriesBurned,
          targetMuscles: sharingWorkout.targetMuscles || sharingWorkout.target_muscles || [],
          notes: sharingWorkout.notes,
          exercises: sharingWorkout.exercises || [],
          date: (sharingWorkout.started_at || sharingWorkout.startedAt || '').split('T')[0],
        } : {}}
      />

      {/* Master Movement Library Modal */}
      <MasterMovementLibraryModal
        isOpen={isMasterLibraryOpen}
        onClose={() => setIsMasterLibraryOpen(false)}
      />
    </div>
  );
};
