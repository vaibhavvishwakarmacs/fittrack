import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkoutSession } from '../../contexts/WorkoutSessionContext';
import { workoutService } from '../../services/workoutService';
import { WorkoutCard } from '../../components/workouts/WorkoutCard';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Dumbbell, Plus, Clock, Trophy } from 'lucide-react';

export const WorkoutsPage = () => {
  const { user, profile } = useAuth();
  const { startSession, hasActiveSavedSession } = useWorkoutSession();
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const handleDelete = async (workoutId) => {
    if (!user) return;
    await workoutService.deleteWorkout(user.id, workoutId);
    loadWorkouts();
  };

  // Stats calculation
  const totalVolume = workouts.reduce((acc, w) => acc + (w.total_volume_kg || 0), 0);
  const totalMinutes = workouts.reduce((acc, w) => acc + (w.duration_minutes || 0), 0);
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

  if (isLoading) {
    return <LoadingSpinner label="Loading workout history..." size="lg" />;
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

        <Button
          variant="primary"
          size="sm"
          onClick={() => startSession(loadWorkouts)}
          leftIcon={<Dumbbell className="w-4 h-4" />}
          className="self-start sm:self-auto font-bold shadow-lime-sm"
        >
          {hasActiveSavedSession ? 'Resume Live Workout' : 'Start Workout Session'}
        </Button>
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
            <span className="text-base sm:text-lg font-black text-white font-sans">{Math.round(totalVolume).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{unit}</span></span>
          </div>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Training Time</p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-base sm:text-lg font-black text-white font-sans">{totalHours} <span className="text-[10px] font-normal text-slate-400">hrs</span></span>
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
                : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-white/5'
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
              onDelete={handleDelete}
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
    </div>
  );
};
