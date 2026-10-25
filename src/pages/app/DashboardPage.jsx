import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkoutSession } from '../../contexts/WorkoutSessionContext';
import { workoutService } from '../../services/workoutService';
import { nutritionService } from '../../services/nutritionService';
import { activityService } from '../../services/activityService';
import { formatDateToISO, getGreeting } from '../../lib/utils';
import { fastCache } from '../../lib/cache';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DashboardSkeleton } from '../../components/common/Skeleton';
import { MacroRing } from '../../components/nutrition/MacroRing';
import { WorkoutCard } from '../../components/workouts/WorkoutCard';
import { WorkoutLoggerModal } from '../../components/workouts/WorkoutLoggerModal';
import { FoodLoggerModal } from '../../components/nutrition/FoodLoggerModal';
import { WeightLoggerModal } from '../../components/profile/WeightLoggerModal';
import { ShareCardModal } from '../../components/common/ShareCardModal';
import {
  Dumbbell,
  Flame,
  Footprints,
  Droplets,
  Plus,
  Scale,
  Share2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, profile } = useAuth();
  const { startSession, hasActiveSavedSession } = useWorkoutSession();
  const navigate = useNavigate();

  const today = formatDateToISO();

  // Instant SWR state: populate synchronously from memory cache if available (0ms loading)
  const cachedWorkouts = user ? fastCache.get(`workouts:${user.id}`) : null;
  const cachedDayNut = user ? fastCache.get(`day_nutrition:${user.id}:${today}`) : null;
  const cachedAct = user ? fastCache.get(`activity:${user.id}:${today}`) : null;
  const hasCachedData = !!(cachedWorkouts || cachedDayNut || cachedAct);

  const [isLoading, setIsLoading] = useState(!hasCachedData);
  const [workouts, setWorkouts] = useState(cachedWorkouts || []);
  const [nutritionLogs, setNutritionLogs] = useState(cachedDayNut?.foodLogs || []);
  const [waterMl, setWaterMl] = useState(cachedDayNut?.totalWaterMl || 0);
  const [waterAddedFeedback, setWaterAddedFeedback] = useState(null);
  const [activity, setActivity] = useState(cachedAct || null);

  // Modals state
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isShareDailyOpen, setIsShareDailyOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      const [woRes, dayNutRes, actRes] = await Promise.all([
        workoutService.getWorkouts(user.id),
        nutritionService.getDayNutrition(user.id, today),
        activityService.getActivityByDate(user.id, today),
      ]);

      setWorkouts(woRes.data || []);
      setNutritionLogs(dayNutRes.data || []);
      setWaterMl(dayNutRes.totalWaterMl || 0);
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

  // Instant Optimistic Water Logger (0ms latency, zero lag)
  const handleQuickWater = (amount) => {
    if (!user) return;
    setWaterMl((prev) => Math.max(0, prev + amount));
    setWaterAddedFeedback(amount > 0 ? `+${amount}ml` : `${amount}ml`);
    setTimeout(() => setWaterAddedFeedback(null), 1200);

    // Update in-memory cache synchronously
    const cached = fastCache.get(`day_nutrition:${user.id}:${today}`);
    if (cached) {
      fastCache.set(`day_nutrition:${user.id}:${today}`, {
        ...cached,
        totalWaterMl: Math.max(0, (cached.totalWaterMl || 0) + amount),
      });
    }

    // Silent background sync
    nutritionService.logWater(user.id, today, amount).catch(() => {
      setWaterMl((prev) => Math.max(0, prev - amount));
    });
  };

  if (isLoading && workouts.length === 0 && !activity) {
    return <DashboardSkeleton />;
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Athlete';

  return (
    <div className="space-y-4 text-left animate-in fade-in pb-10">
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
          <div className="grid grid-cols-3 sm:flex sm:items-center gap-2">
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
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsShareDailyOpen(true)}
              leftIcon={<Share2 className="w-3.5 h-3.5 text-lime" />}
              className="justify-center py-2"
              title="Share Fitness Card"
            >
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Core Stat Cards - Clean Apple Fitness Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Daily Steps */}
        <StatCard
          title="Steps"
          value={todaySteps.toLocaleString()}
          unit="steps"
          icon={<Footprints className="w-4 h-4 text-lime" />}
          iconBg="bg-lime/10"
          progress={{
            current: todaySteps,
            target: targetSteps,
            color: 'bg-lime',
          }}
          onClick={() => navigate('/app/activity')}
        />

        {/* Calories Burned (Active + Workout) */}
        <StatCard
          title="Active Burn"
          value={((activity?.active_calories || 0) + (todayWorkout?.calories_burned || 0)).toLocaleString()}
          unit="kcal"
          subtitle={todayWorkout ? `${todayWorkout.calories_burned} kcal lift` : 'Walking & daily'}
          icon={<Flame className="w-4 h-4 text-amber-400" />}
          iconBg="bg-amber-400/10"
        />

        {/* Water Intake - Direct 1-tap Instant Quick Add */}
        <StatCard
          title="Hydration"
          value={waterMl.toLocaleString()}
          unit="ml"
          icon={<Droplets className={`w-4 h-4 text-sky-400 transition-transform ${waterAddedFeedback ? 'scale-125 text-cyan-300' : ''}`} />}
          iconBg="bg-sky-400/10"
          subtitle={
            waterAddedFeedback ? (
              <span className="text-cyan-300 font-extrabold animate-pulse">{waterAddedFeedback} added!</span>
            ) : (
              `${Math.min(Math.round((waterMl / targetWater) * 100), 100)}% of goal`
            )
          }
          progress={{
            current: waterMl,
            target: targetWater,
            color: 'bg-sky-400',
          }}
          action={
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => handleQuickWater(250)}
                className="flex-1 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 active:scale-90 text-[10px] font-bold text-sky-300 border border-sky-500/30 text-center transition-all"
                title="Log 250ml"
              >
                +250ml
              </button>
              <button
                type="button"
                onClick={() => handleQuickWater(500)}
                className="flex-1 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 active:scale-90 text-[10px] font-bold text-sky-300 border border-sky-500/40 text-center transition-all shadow-[0_0_10px_rgba(56,189,248,0.15)]"
                title="Log 500ml"
              >
                +500ml
              </button>
            </div>
          }
        />

        {/* Weight Tracker - Clean Title */}
        <StatCard
          title="Weight"
          value={profile?.current_weight_kg ? profile.current_weight_kg : '--'}
          unit={unit}
          subtitle={profile?.target_weight_kg ? `Goal: ${profile.target_weight_kg} ${unit}` : undefined}
          icon={<Scale className="w-4 h-4 text-purple-400" />}
          iconBg="bg-purple-400/10"
          onClick={() => setIsWeightModalOpen(true)}
        />
      </div>

      {/* Today's Workout - High Signal Glance Card */}
      <section aria-labelledby="today-workout-heading" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 id="today-workout-heading" className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
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
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-lime/30 flex items-center justify-between gap-3 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-lime/10 text-lime flex items-center justify-center shrink-0">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-white truncate">No workout logged yet today</p>
                <p className="text-[11px] text-slate-400 truncate">Ready to train? Start your live split</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => startSession(loadDashboardData)}
              className="shrink-0 text-xs font-extrabold py-2 px-3 shadow-lime-sm"
            >
              Start Live
            </Button>
          </div>
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

      {/* Modals */}
      <FoodLoggerModal
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        onFoodLogged={loadDashboardData}
        defaultDate={today}
      />

      <WeightLoggerModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onWeightLogged={loadDashboardData}
        defaultDate={today}
      />

      {/* Share Daily / Weight Fitness Card */}
      <ShareCardModal
        isOpen={isShareDailyOpen}
        onClose={() => setIsShareDailyOpen(false)}
        type="daily"
        unit={unit}
        data={{
          user_name: firstName,
          current_weight_kg: profile?.current_weight_kg,
          target_weight_kg: profile?.target_weight_kg,
          steps: todaySteps,
          water_ml: waterMl,
          calories_burned: (activity?.active_calories || 0) + (todayWorkout?.calories_burned || 0),
          date: today,
        }}
      />
    </div>
  );
};
