import React, { useState } from 'react';
import { formatDisplayDate } from '../../lib/utils';
import {
  Clock,
  Flame,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
} from 'lucide-react';

export const WorkoutCard = ({
  workout,
  unit = 'kg',
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const rawDate = workout.started_at || workout.startedAt || new Date().toISOString();
  const formattedDate = formatDisplayDate(rawDate.split('T')[0]);

  const duration = workout.duration_minutes || workout.durationMinutes || 0;
  const volume = workout.total_volume_kg || workout.totalVolumeKg || 0;
  const calories = workout.calories_burned || workout.caloriesBurned || 0;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-white/15 transition-all text-left">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
              {workout.category}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>{formattedDate}</span>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {workout.title}
          </h3>
          {workout.notes && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
              "{workout.notes}"
            </p>
          )}
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(workout.id)}
            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
            title="Delete workout"
            aria-label="Delete workout"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[0.06] text-center">
        <div className="flex items-center justify-center gap-1.5 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-xs font-semibold">{duration} min</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-slate-300">
          <Dumbbell className="w-3.5 h-3.5 text-lime shrink-0" />
          <span className="text-xs font-semibold">{Number(volume).toLocaleString()} {unit}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-slate-300">
          <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold">{calories} kcal</span>
        </div>
      </div>

      {/* Expand/Collapse exercises toggle */}
      {workout.exercises && workout.exercises.length > 0 && (
        <div className="mt-3 pt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white font-medium py-1 focus:outline-none transition-colors"
          >
            <span>
              {workout.exercises.length} {workout.exercises.length === 1 ? 'Exercise' : 'Exercises'} logged
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isExpanded && (
            <div className="mt-2.5 space-y-2 pt-2 border-t border-white/[0.04] animate-in fade-in">
              {workout.exercises.map((ex, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-dark-950/60 border border-white/5 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-200 mb-1.5">
                    <span>{ex.exercise_name || ex.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {(ex.sets || []).length} sets
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(ex.sets || []).map((s, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-md bg-dark-850 text-slate-300 text-[10px] font-mono border border-white/5"
                      >
                        {s.weight_kg ?? s.weightKg}{unit} × {s.reps} {s.rpe ? `@RPE${s.rpe}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
