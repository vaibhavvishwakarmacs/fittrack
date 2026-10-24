import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkoutSession } from '../../contexts/WorkoutSessionContext';
import { workoutService } from '../../services/workoutService';
import { nutritionService } from '../../services/nutritionService';
import { activityService } from '../../services/activityService';
import { formatDateToISO, getGreeting } from '../../lib/utils';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MacroRing } from '../../components/nutrition/MacroRing';
import { WaterTracker } from '../../components/nutrition/WaterTracker';
import { WorkoutCard } from '../../components/workouts/WorkoutCard';
import { WorkoutLoggerModal } from '../../components/workouts/WorkoutLoggerModal';
import { FoodLoggerModal } from '../../components/nutrition/FoodLoggerModal';
import { StepLoggerModal } from '../../components/activity/StepLoggerModal';
import { WeightLoggerModal } from '../../components/profile/WeightLoggerModal';
import {
  Dumbbell,
  Flame,
  Footprints,
  Droplets,
  Plus,
  Scale,
  ChevronRight,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, profile } = useAuth();
  const { startSession, hasActiveSavedSession } = useWorkoutSession();
  const navigate = useNavigate();

  const today = formatDateToISO();
  const [isLoading, setIsLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [nutritionLogs, setNutritionLogs] = useState([]);
  const [waterMl, setWaterMl] = useState(0);
  const [activity, setActivity] = useState(null);

  // Modals state
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      const [woRes, nutRes, waterRes, actRes] = await Promise.all([
        workoutService.getWorkouts(user.id),
        nutritionService.getNutritionLogs(user.id, today),
        nutritionService.getWaterLogs(user.id, today),
        activityService.getActivityByDate(user.id, today),
      ]);

      setWorkouts(woRes.data || []);
      setNutritionLogs(nutRes.data || []);
      setWaterMl(waterRes.totalMl || 0);
      setActivity(actRes.data || null);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Compute nutrition totals for today
  const totalCalories = nutritionLogs.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalProtein = nutritionLogs.reduce((acc, curr) => acc + Number(curr.protein_g || 0), 0);
  const totalCarbs = nutritionLogs.reduce((acc, curr) => acc + Number(curr.carbs_g || 0), 0);
  const totalFat = nutritionLogs.reduce((acc, curr) => acc + Number(curr.fat_g || 0), 0);

  const targetCalories = profile?.daily_calorie_target || 2200;
  const targetProtein = profile?.daily_protein_target_g || 140;
  const targetCarbs = profile?.daily_carbs_target_g || 230;
  const targetFat = profile?.daily_fat_target_g || 65;
  const targetSteps = profile?.daily_step_target || 10000;
  const targetWater = profile?.daily_water_target_ml || 2500;
  const unit = profile?.unit_system === 'imperial' ? 'lbs' : 'kg';

  const todaySteps = activity?.steps || 0;
  const todayWorkout = workouts.find((w) => (w.started_at || '').startsWith(today));

  if (isLoading) {
    return <LoadingSpinner label="Loading fitness dashboard..." size="lg" />;
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Athlete';

  return (
    <div className="space-y-6 text-left animate-in fade-in pb-10">
      {/* Top Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-lime">
            <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
            <span>{getGreeting()}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            {firstName}
          </h1>
          <p className="text-xs text-slate-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Launch Buttons - Clean Mobile-First Layout */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <Button
            size="md"
            variant="primary"
            onClick={() => startSession(loadDashboardData)}
            leftIcon={<Dumbbell className="w-4 h-4 shrink-0" />}
            className="w-full sm:w-auto font-extrabold shadow-lime-sm justify-center py-2.5 px-4"
          >
            {hasActiveSavedSession ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-dark-950 animate-ping inline-block" />
                <span>Resume Live Workout</span>
              </span>
            ) : (
              'Start Workout Session'
            )}
          </Button>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsFoodModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5 text-amber-400" />}
              className="justify-center py-2"
            >
              Log Food
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsWeightModalOpen(true)}
              leftIcon={<Scale className="w-3.5 h-3.5 text-sky-400" />}
              className="justify-center py-2"
            >
              Weigh-in
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Daily Steps */}
        <StatCard
          title="Daily Steps"
          value={todaySteps.toLocaleString()}
          unit="steps"
          icon={<Footprints className="w-4 h-4 text-lime" />}
          iconBg="bg-lime/10"
          progress={{
            current: todaySteps,
            target: targetSteps,
            color: 'bg-lime',
          }}
          onClick={() => setIsStepModalOpen(true)}
        />

        {/* Calories Burned (Active + Workout) */}
        <StatCard
          title="Active Burn"
          value={((activity?.active_calories || 0) + (todayWorkout?.calories_burned || 0)).toLocaleString()}
          unit="kcal"
          subtitle={todayWorkout ? `Includes ${todayWorkout.calories_burned} kcal lifting` : 'Walking & cardio'}
          icon={<Flame className="w-4 h-4 text-amber-400" />}
          iconBg="bg-amber-400/10"
        />

        {/* Water Intake */}
        <StatCard
          title="Water"
          value={waterMl.toLocaleString()}
          unit="ml"
          icon={<Droplets className="w-4 h-4 text-sky-400" />}
          iconBg="bg-sky-400/10"
          progress={{
            current: waterMl,
            target: targetWater,
            color: 'bg-sky-400',
          }}
          onClick={() => {}}
        />

        {/* Weight Tracker */}
        <StatCard
          title="Current Weight"
          value={profile?.current_weight_kg ? profile.current_weight_kg : '--'}
          unit={unit}
          subtitle={profile?.target_weight_kg ? `Goal: ${profile.target_weight_kg} ${unit}` : undefined}
          icon={<Scale className="w-4 h-4 text-purple-400" />}
          iconBg="bg-purple-400/10"
          onClick={() => setIsWeightModalOpen(true)}
        />
      </div>

      {/* Today's Workout Focus */}
      <section aria-labelledby="today-workout-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="today-workout-heading" className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-lime" />
            <span>Today's Workout</span>
          </h2>
          <button
            onClick={() => navigate('/app/workouts')}
            className="text-xs font-semibold text-lime hover:underline flex items-center gap-1"
          >
            <span>View All ({workouts.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayWorkout ? (
          <WorkoutCard
            workout={todayWorkout}
            unit={unit}
            onDelete={async (id) => {
              if (!user) return;
              await workoutService.deleteWorkout(user.id, id);
              loadDashboardData();
            }}
          />
        ) : (
          <EmptyState
            icon={<Dumbbell className="w-7 h-7" />}
            title="No workout logged for today"
            description="Hit the iron, start a live training session, and record your sets and load in real time."
            actionLabel="Start Live Workout Session"
            actionIcon={<Plus className="w-4 h-4" />}
            onAction={() => startSession(loadDashboardData)}
          />
        )}
      </section>

      {/* Nutrition & Macros Ring */}
      <section aria-labelledby="macros-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="macros-heading" className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Today's Nutrition &amp; Macros</span>
          </h2>
          <button
            onClick={() => navigate('/app/nutrition')}
            className="text-xs font-semibold text-lime hover:underline flex items-center gap-1"
          >
            <span>Nutrition Diary</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <MacroRing
          calories={totalCalories}
          targetCalories={targetCalories}
          protein={totalProtein}
          targetProtein={targetProtein}
          carbs={totalCarbs}
          targetCarbs={targetCarbs}
          fat={totalFat}
          targetFat={targetFat}
        />
      </section>

      {/* Hydration Tracker */}
      <WaterTracker
        currentWaterMl={waterMl}
        targetWaterMl={targetWater}
        date={today}
        onWaterUpdated={loadDashboardData}
      />

      {/* Modals */}
      <FoodLoggerModal
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        onFoodLogged={loadDashboardData}
        defaultDate={today}
      />

      <StepLoggerModal
        isOpen={isStepModalOpen}
        onClose={() => setIsStepModalOpen(false)}
        onActivitySaved={loadDashboardData}
        defaultDate={today}
        initialSteps={todaySteps}
      />

      <WeightLoggerModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onWeightLogged={loadDashboardData}
        defaultDate={today}
      />
    </div>
  );
};
