import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkoutSession } from '../../contexts/WorkoutSessionContext';
import { workoutService } from '../../services/workoutService';
import { nutritionService } from '../../services/nutritionService';
import { activityService } from '../../services/activityService';
import { formatDateToISO, formatDisplayDate } from '../../lib/utils';
import { Button } from '../../components/common/Button';
import { WorkoutCard } from '../../components/workouts/WorkoutCard';
import { FoodLoggerModal } from '../../components/nutrition/FoodLoggerModal';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Plus,
  Footprints,
} from 'lucide-react';

export const CalendarPage = () => {
  const { user, profile } = useAuth();
  const { startSession } = useWorkoutSession();
  const [selectedDate, setSelectedDate] = useState(() => formatDateToISO());
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const [workouts, setWorkouts] = useState([]);
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [activity, setActivity] = useState(null);

  // Modals
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);

  const unit = profile?.unit_system === 'imperial' ? 'lbs' : 'kg';

  // Load all user workouts once to show calendar dots
  const [allWorkouts, setAllWorkouts] = useState([]);
  useEffect(() => {
    if (!user) return;
    workoutService.getWorkouts(user.id).then(({ data }) => {
      setAllWorkouts(data || []);
    });
  }, [user]);

  // Load details for selected date
  const loadDayData = useCallback(async (date) => {
    if (!user) return;
    try {
      const [woRes, nutRes, actRes] = await Promise.all([
        workoutService.getWorkouts(user.id),
        nutritionService.getNutritionLogs(user.id, date),
        activityService.getActivityByDate(user.id, date),
      ]);

      const dayWorkouts = (woRes.data || []).filter((w) => (w.started_at || '').startsWith(date));
      setWorkouts(dayWorkouts);
      setNutritionLogs(nutRes.data || []);
      setActivity(actRes.data || null);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    loadDayData(selectedDate);
  }, [selectedDate, loadDayData]);

  // Generate calendar days for currentMonth
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 for Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Compute days
  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(month + 1).padStart(2, '0');
    calendarDays.push(`${year}-${monthStr}-${dayStr}`);
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayIso = formatDateToISO();

  // Calories for selected date
  const dayCalories = nutritionLogs.reduce((acc, curr) => acc + (curr.calories || 0), 0);

  return (
    <div className="space-y-4 text-left animate-in fade-in pb-12">
      {/* Clean Minimal Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-lime" />
          <span>Calendar</span>
        </h1>

        <Button
          size="sm"
          variant="primary"
          onClick={() =>
            startSession(() => {
              loadDayData(selectedDate);
              if (user) {
                workoutService.getWorkouts(user.id).then(({ data }) => setAllWorkouts(data || []));
              }
            })
          }
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="font-bold shadow-lime-sm text-xs"
        >
          Start Session
        </Button>
      </div>

      {/* Compact Calendar Card */}
      <div className="rounded-2xl p-3 sm:p-5 bg-white/[0.03] border border-white/10 shadow-lg">
        {/* Month selector header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">{monthName}</h2>
            {/* Minimal inline indicator */}
            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block" />
              <span>Workout</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-white/5 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDate(todayIso);
              }}
              className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-white/5 transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-white/5 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Compact Calendar Grid - Reduced mobile height */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarDays.map((dateStr, idx) => {
            if (!dateStr) {
              return <div key={`empty-${idx}`} className="h-9 sm:h-11 rounded-xl opacity-0" />;
            }

            const dayNum = parseInt(dateStr.split('-')[2], 10);
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === todayIso;

            // Check if there is workout on this date
            const hasWorkout = allWorkouts.some((w) => (w.started_at || '').startsWith(dateStr));

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`h-9 sm:h-11 rounded-xl flex flex-col items-center justify-between p-1 transition-all focus:outline-none relative select-none ${
                  isSelected
                    ? 'bg-lime text-dark-950 font-black shadow-lime-sm scale-105 z-10'
                    : isToday
                    ? 'bg-dark-850 border border-lime/50 text-white font-bold'
                    : 'bg-dark-950/60 hover:bg-dark-800 text-slate-300 border border-white/5'
                }`}
              >
                <span className="text-xs sm:text-sm font-semibold">{dayNum}</span>

                {/* Status dot */}
                <div className="flex gap-1 items-center justify-center h-1.5">
                  {hasWorkout && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-dark-950' : 'bg-lime'
                      }`}
                      title="Workout logged"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Section */}
      <div className="space-y-3">
        {/* Day Header & Action */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            <span>{formatDisplayDate(selectedDate)}</span>
            {selectedDate === todayIso && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-lime/20 text-lime font-bold">
                Today
              </span>
            )}
          </h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsFoodModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5 text-amber-400" />}
            className="text-xs"
          >
            Log Food
          </Button>
        </div>

        {/* Day's Quick Summary Strip */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-center text-xs">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Workouts</p>
            <p className="font-extrabold text-lime mt-0.5">{workouts.length}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Calories</p>
            <p className="font-extrabold text-amber-400 mt-0.5">{dayCalories} kcal</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Steps</p>
            <p className="font-extrabold text-sky-400 mt-0.5">
              {(activity?.steps || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Workouts list for selected day */}
        {workouts.length > 0 ? (
          <div className="space-y-2.5">
            {workouts.map((w) => (
              <WorkoutCard
                key={w.id}
                workout={w}
                unit={unit}
                onDelete={async (id) => {
                  if (!user) return;
                  await workoutService.deleteWorkout(user.id, id);
                  loadDayData(selectedDate);
                }}
              />
            ))}
          </div>
        ) : (
          /* Clean 1-line Rest Day Pill instead of giant empty box */
          <div className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-3.5 h-3.5 text-slate-500" />
              <span>Rest Day • No workouts logged</span>
            </div>
            <button
              type="button"
              onClick={() =>
                startSession(() => {
                  loadDayData(selectedDate);
                  if (user) {
                    workoutService.getWorkouts(user.id).then(({ data }) => setAllWorkouts(data || []));
                  }
                })
              }
              className="text-[11px] font-bold text-lime hover:underline"
            >
              + Start
            </button>
          </div>
        )}

        {/* Meals logged for selected day */}
        {nutritionLogs.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Meals Recorded ({nutritionLogs.length})</span>
            </h3>
            <div className="divide-y divide-white/[0.04]">
              {nutritionLogs.map((log) => (
                <div key={log.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-white capitalize truncate block">
                      {log.food_name}
                    </span>
                    <span className="text-[10px] text-slate-400 block capitalize truncate">
                      {log.meal_type} • {log.serving_size}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-amber-400">{log.calories} kcal</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {log.protein_g}P • {log.carbs_g}C • {log.fat_g}F
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <FoodLoggerModal
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        onFoodLogged={() => loadDayData(selectedDate)}
        defaultDate={selectedDate}
      />
    </div>
  );
};
