import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { onboardingSchema } from '../../validations/schemas';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Dumbbell,
  Flame,
  Scale,
  Footprints,
  Droplets,
  Check,
  ArrowRight,
  ArrowLeft,
  HeartPulse,
} from 'lucide-react';

export const OnboardingPage = () => {
  const { user, profile, updateProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: profile?.full_name || user?.user_metadata?.full_name || '',
      fitnessGoal: profile?.fitness_goal || 'build_muscle',
      activityLevel: profile?.activity_level || 'moderate',
      gender: profile?.gender || 'other',
      unitSystem: profile?.unit_system || 'metric',
      currentWeight: profile?.current_weight_kg || 75,
      targetWeight: profile?.target_weight_kg || 75,
      height: profile?.height_cm || 178,
      dailyCalorieTarget: profile?.daily_calorie_target || 2300,
      dailyProteinTarget: profile?.daily_protein_target_g || 150,
      dailyCarbsTarget: profile?.daily_carbs_target_g || 240,
      dailyFatTarget: profile?.daily_fat_target_g || 70,
      dailyStepTarget: profile?.daily_step_target || 10000,
      dailyWaterTarget: profile?.daily_water_target_ml || 2500,
    },
  });

  const selectedGoal = watch('fitnessGoal');
  const selectedLevel = watch('activityLevel');
  const selectedUnit = watch('unitSystem');

  const goals = [
    { id: 'build_muscle', label: 'Build Muscle', desc: 'Hypertrophy and lean mass gain', icon: Dumbbell },
    { id: 'lose_fat', label: 'Lose Fat', desc: 'Calorie deficit and body recomp', icon: Flame },
    { id: 'strength', label: 'Gain Strength', desc: 'Heavy compounds and power lifting', icon: Trophy },
    { id: 'endurance', label: 'Cardio & Stamina', desc: 'Aerobic fitness and distance capacity', icon: HeartPulse },
    { id: 'maintain', label: 'Maintain & Tone', desc: 'Sustain current weight & stay fit', icon: Scale },
  ];

  const activityLevels = [
    { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little intentional exercise' },
    { id: 'light', label: 'Lightly Active', desc: '1-2 light workouts per week' },
    { id: 'moderate', label: 'Moderately Active', desc: '3-5 training sessions per week' },
    { id: 'very_active', label: 'Very Active', desc: '6-7 intense workout sessions per week' },
  ];

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const { error } = await updateProfile({
        full_name: data.fullName,
        fitness_goal: data.fitnessGoal,
        activity_level: data.activityLevel,
        gender: data.gender,
        unit_system: data.unitSystem,
        current_weight_kg: data.currentWeight,
        target_weight_kg: data.targetWeight,
        height_cm: data.height,
        daily_calorie_target: data.dailyCalorieTarget,
        daily_protein_target_g: data.dailyProteinTarget,
        daily_carbs_target_g: data.dailyCarbsTarget,
        daily_fat_target_g: data.dailyFatTarget,
        daily_step_target: data.dailyStepTarget,
        daily_water_target_ml: data.dailyWaterTarget,
        onboarding_completed: true,
      });

      if (error) {
        toastError(error.message || 'Failed to save profile targets');
      } else {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#bbf43d', '#ccff00', '#38bdf8', '#ffffff'],
        });
        success('Profile and fitness targets saved!');
        navigate('/app/dashboard');
      }
    } catch (err) {
      toastError(err?.message || 'Error completing onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center px-4 py-8">
      <div className="max-w-xl w-full mx-auto">
        {/* Progress header */}
        <div className="mb-6 text-left">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Step {step} of 3</span>
            <span className="text-lime font-bold">
              {step === 1 ? 'Goals & Activity' : step === 2 ? 'Body Metrics' : 'Daily Targets'}
            </span>
          </div>
          <div className="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-lime h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Goal & Activity */}
            {step === 1 && (
              <div className="space-y-6 text-left animate-in fade-in">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">What is your primary fitness goal?</h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    FitTrack personalizes your calorie, macro, and workout expectations accordingly.
                  </p>
                </div>

                <Input
                  label="Your Display Name"
                  placeholder="e.g. Jordan Lee"
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Select Your Goal
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {goals.map((g) => {
                      const Icon = g.icon;
                      const isSelected = selectedGoal === g.id;
                      return (
                        <div
                          key={g.id}
                          onClick={() => setValue('fitnessGoal', g.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'bg-lime/10 border-lime text-white shadow-lime-sm'
                              : 'bg-dark-850/80 border-white/5 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-lime text-dark-950 font-bold' : 'bg-white/5 text-slate-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-white tracking-tight">{g.label}</h3>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{g.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Weekly Activity Level
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activityLevels.map((lvl) => {
                      const isSelected = selectedLevel === lvl.id;
                      return (
                        <div
                          key={lvl.id}
                          onClick={() => setValue('activityLevel', lvl.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-lime/10 border-lime text-white'
                              : 'bg-dark-850/80 border-white/5 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          <p className="font-bold text-white">{lvl.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{lvl.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue to Body Metrics
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Body Metrics */}
            {step === 2 && (
              <div className="space-y-5 text-left animate-in fade-in">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Your Body Measurements</h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Used for calculating basal metabolic rate (BMR) and tracking progress.
                  </p>
                </div>

                {/* Unit toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-dark-850 border border-white/10">
                  <span className="text-xs font-semibold text-slate-300">Measurement Units</span>
                  <div className="flex gap-1 bg-dark-900 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setValue('unitSystem', 'metric')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        selectedUnit === 'metric' ? 'bg-lime text-dark-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Metric (kg/cm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('unitSystem', 'imperial')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        selectedUnit === 'imperial' ? 'bg-lime text-dark-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Imperial (lbs/in)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={`Current Weight (${selectedUnit === 'imperial' ? 'lbs' : 'kg'})`}
                    type="number"
                    step="0.1"
                    placeholder="75"
                    error={errors.currentWeight?.message}
                    {...register('currentWeight')}
                  />
                  <Input
                    label={`Target Weight (${selectedUnit === 'imperial' ? 'lbs' : 'kg'})`}
                    type="number"
                    step="0.1"
                    placeholder="75"
                    error={errors.targetWeight?.message}
                    {...register('targetWeight')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={`Height (${selectedUnit === 'imperial' ? 'inches' : 'cm'})`}
                    type="number"
                    step="0.5"
                    placeholder="178"
                    error={errors.height?.message}
                    {...register('height')}
                  />
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                      Gender
                    </label>
                    <select
                      className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-lime transition-colors"
                      {...register('gender')}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-between items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue to Targets
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Daily Targets */}
            {step === 3 && (
              <div className="space-y-5 text-left animate-in fade-in">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Set Your Daily Targets</h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Fine-tune your daily nutrition, steps, and hydration milestones. You can always adjust these in Settings.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-dark-850/90 border border-white/10 space-y-4">
                  <Input
                    label="Daily Calorie Goal (kcal)"
                    type="number"
                    placeholder="2300"
                    leftIcon={<Flame className="w-4 h-4 text-amber-400" />}
                    error={errors.dailyCalorieTarget?.message}
                    {...register('dailyCalorieTarget')}
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      label="Protein (g)"
                      type="number"
                      placeholder="150"
                      error={errors.dailyProteinTarget?.message}
                      {...register('dailyProteinTarget')}
                    />
                    <Input
                      label="Carbs (g)"
                      type="number"
                      placeholder="240"
                      error={errors.dailyCarbsTarget?.message}
                      {...register('dailyCarbsTarget')}
                    />
                    <Input
                      label="Fat (g)"
                      type="number"
                      placeholder="70"
                      error={errors.dailyFatTarget?.message}
                      {...register('dailyFatTarget')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Daily Step Goal"
                    type="number"
                    placeholder="10000"
                    leftIcon={<Footprints className="w-4 h-4 text-lime" />}
                    error={errors.dailyStepTarget?.message}
                    {...register('dailyStepTarget')}
                  />
                  <Input
                    label="Daily Water Goal (ml)"
                    type="number"
                    placeholder="2500"
                    leftIcon={<Droplets className="w-4 h-4 text-sky-400" />}
                    error={errors.dailyWaterTarget?.message}
                    {...register('dailyWaterTarget')}
                  />
                </div>

                <div className="pt-3 flex justify-between items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(2)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    rightIcon={<Check className="w-4 h-4" />}
                  >
                    Finish Setup &amp; Enter FitTrack
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
