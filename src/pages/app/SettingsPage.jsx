import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { profileSettingsSchema } from '../../validations/schemas';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import {
  Settings,
  User,
  Flame,
  Footprints,
  Droplets,
  LogOut,
  Save,
  Download,
  Database,
} from 'lucide-react';

export const SettingsPage = () => {
  const { profile, updateProfile, signOut, isConfigured } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Catch PWA beforeinstallprompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      alert('To install on iPhone: Tap the Share button in Safari, then tap "Add to Home Screen". On Chrome/Android: Tap menu and choose "Install App".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      success('FitTrack installed successfully!');
    }
    setDeferredPrompt(null);
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      fullName: profile?.full_name || '',
      fitnessGoal: profile?.fitness_goal || 'build_muscle',
      activityLevel: profile?.activity_level || 'moderate',
      unitSystem: profile?.unit_system || 'metric',
      currentWeightKg: profile?.current_weight_kg || 75,
      targetWeightKg: profile?.target_weight_kg || 75,
      heightCm: profile?.height_cm || 178,
      dailyCalorieTarget: profile?.daily_calorie_target || 2200,
      dailyProteinTargetG: profile?.daily_protein_target_g || 140,
      dailyCarbsTargetG: profile?.daily_carbs_target_g || 230,
      dailyFatTargetG: profile?.daily_fat_target_g || 65,
      dailyStepTarget: profile?.daily_step_target || 10000,
      dailyWaterTargetMl: profile?.daily_water_target_ml || 2500,
    },
  });

  const selectedUnit = watch('unitSystem');

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      const { error } = await updateProfile({
        full_name: data.fullName,
        fitness_goal: data.fitnessGoal,
        activity_level: data.activityLevel,
        unit_system: data.unitSystem,
        current_weight_kg: data.currentWeightKg,
        target_weight_kg: data.targetWeightKg,
        height_cm: data.heightCm,
        daily_calorie_target: data.dailyCalorieTarget,
        daily_protein_target_g: data.dailyProteinTargetG,
        daily_carbs_target_g: data.dailyCarbsTargetG,
        daily_fat_target_g: data.dailyFatTargetG,
        daily_step_target: data.dailyStepTarget,
        daily_water_target_ml: data.dailyWaterTargetMl,
      });

      if (error) {
        toastError(error.message || 'Failed to update settings');
      } else {
        success('FitTrack settings and targets updated!');
      }
    } catch (err) {
      toastError(err?.message || 'Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-lime" />
          <span>App Settings &amp; Goals</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure measurement preferences, target calories, and install PWA
        </p>
      </div>

      {/* PWA Install Promotion Card */}
      <div className="glass-card rounded-3xl p-5 border border-lime/30 bg-gradient-to-r from-lime/10 via-dark-900 to-dark-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-lime bg-lime/20 px-2 py-0.5 rounded-full inline-block mb-1">
            Installable Progressive Web App
          </span>
          <h2 className="text-base font-bold text-white tracking-tight">
            Install FitTrack on iPhone / Android
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 max-w-md">
            Get instant home screen access, offline support, full-screen fitness dashboard, and fast native-like gestures.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleInstallPWA}
          leftIcon={<Download className="w-4 h-4" />}
        >
          {isInstalled ? 'App Installed' : 'Install PWA'}
        </Button>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile & Body Info */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-lime" />
            <span>Profile &amp; Units</span>
          </h2>

          <Input
            label="Display Name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Fitness Goal
              </label>
              <select
                className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-lime"
                {...register('fitnessGoal')}
              >
                <option value="build_muscle">Build Muscle</option>
                <option value="lose_fat">Lose Fat</option>
                <option value="maintain">Maintain &amp; Tone</option>
                <option value="strength">Gain Strength</option>
                <option value="endurance">Endurance &amp; Cardio</option>
                <option value="general_health">General Health</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Activity Level
              </label>
              <select
                className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-lime"
                {...register('activityLevel')}
              >
                <option value="sedentary">Sedentary (Desk Job)</option>
                <option value="light">Lightly Active</option>
                <option value="moderate">Moderately Active</option>
                <option value="very_active">Very Active (Gym 5-6x)</option>
                <option value="extra_active">Extra Active (Athlete)</option>
              </select>
            </div>
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-dark-950 border border-white/5">
            <div>
              <p className="text-xs font-semibold text-slate-200">Measurement System</p>
              <p className="text-[10px] text-slate-400">Controls kg vs lbs, cm vs inches</p>
            </div>
            <div className="flex gap-1 bg-dark-900 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setValue('unitSystem', 'metric')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  selectedUnit === 'metric' ? 'bg-lime text-dark-950' : 'text-slate-400'
                }`}
              >
                Metric (kg)
              </button>
              <button
                type="button"
                onClick={() => setValue('unitSystem', 'imperial')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  selectedUnit === 'imperial' ? 'bg-lime text-dark-950' : 'text-slate-400'
                }`}
              >
                Imperial (lbs)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label={`Current Weight (${selectedUnit === 'imperial' ? 'lbs' : 'kg'})`}
              type="number"
              step="0.1"
              error={errors.currentWeightKg?.message}
              {...register('currentWeightKg')}
            />
            <Input
              label={`Target Weight (${selectedUnit === 'imperial' ? 'lbs' : 'kg'})`}
              type="number"
              step="0.1"
              error={errors.targetWeightKg?.message}
              {...register('targetWeightKg')}
            />
            <Input
              label="Height (cm)"
              type="number"
              error={errors.heightCm?.message}
              {...register('heightCm')}
            />
          </div>
        </div>

        {/* Daily Target Milestones */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Daily Nutrition &amp; Activity Targets</span>
          </h2>

          <Input
            label="Daily Calories (kcal)"
            type="number"
            leftIcon={<Flame className="w-4 h-4 text-amber-400" />}
            error={errors.dailyCalorieTarget?.message}
            {...register('dailyCalorieTarget')}
          />

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Protein (g)"
              type="number"
              error={errors.dailyProteinTargetG?.message}
              {...register('dailyProteinTargetG')}
            />
            <Input
              label="Carbs (g)"
              type="number"
              error={errors.dailyCarbsTargetG?.message}
              {...register('dailyCarbsTargetG')}
            />
            <Input
              label="Fat (g)"
              type="number"
              error={errors.dailyFatTargetG?.message}
              {...register('dailyFatTargetG')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Daily Steps Goal"
              type="number"
              leftIcon={<Footprints className="w-4 h-4 text-lime" />}
              error={errors.dailyStepTarget?.message}
              {...register('dailyStepTarget')}
            />
            <Input
              label="Daily Water Goal (ml)"
              type="number"
              leftIcon={<Droplets className="w-4 h-4 text-sky-400" />}
              error={errors.dailyWaterTargetMl?.message}
              {...register('dailyWaterTargetMl')}
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Target Changes
          </Button>
        </div>
      </form>

      {/* Database & Account Area */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-400" />
          <span>System Status &amp; Account</span>
        </h2>

        <div className="p-3.5 rounded-2xl bg-dark-950 border border-white/5 flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-white">Database Engine</p>
            <p className="text-slate-400 text-[11px]">
              {isConfigured ? 'Connected to MongoDB Database & API' : 'Local Sandbox Storage Mode'}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-[10px] font-bold ${
              isConfigured ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
            }`}
          >
            {isConfigured ? 'MongoDB Active' : 'Sandbox Mode'}
          </span>
        </div>

        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white">Sign Out</p>
            <p className="text-[11px] text-slate-400">Leave your current session</p>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
