import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { weightService } from '../../services/weightService';
import { formatDisplayDate } from '../../lib/utils';
import { AvatarUploader } from '../../components/profile/AvatarUploader';
import { WeightChart } from '../../components/profile/WeightChart';
import { WeightLoggerModal } from '../../components/profile/WeightLoggerModal';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Scale,
  Calendar,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, profile } = useAuth();
  const [weightLogs, setWeightLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  const unit = profile?.unit_system === 'imperial' ? 'lbs' : 'kg';

  const loadWeightHistory = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await weightService.getWeightLogs(user.id);
      setWeightLogs(data || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWeightHistory();
  }, [loadWeightHistory]);

  const handleDeleteWeight = async (logId) => {
    if (!user) return;
    await weightService.deleteWeightLog(user.id, logId);
    loadWeightHistory();
  };

  const currentWeight = weightLogs.length > 0
    ? weightLogs[weightLogs.length - 1].weight_kg
    : profile?.current_weight_kg || 0;

  const targetWeight = profile?.target_weight_kg || 0;
  const weightDifference = targetWeight && currentWeight
    ? Math.abs(currentWeight - targetWeight).toFixed(1)
    : null;

  if (isLoading) {
    return <LoadingSpinner label="Loading profile and body metrics..." size="lg" />;
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in pb-12">
      {/* Profile Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <AvatarUploader />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {profile?.full_name || user?.email?.split('@')[0]}
              </h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-lime/15 text-lime border border-lime/30 capitalize">
                {profile?.fitness_goal?.replace('_', ' ') || 'Athlete'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-300">
              <span>Height: <strong className="text-white">{profile?.height_cm || 178} cm</strong></span>
              <span>•</span>
              <span>System: <strong className="text-white capitalize">{profile?.unit_system || 'Metric'}</strong></span>
              <span>•</span>
              <span>Activity: <strong className="text-white capitalize">{profile?.activity_level?.replace('_', ' ') || 'Active'}</strong></span>
            </div>
          </div>

          <Link
            to="/app/settings"
            className="p-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-white/10 transition-colors focus:outline-none"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Weight Target Progress Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-dark-900 border border-white/10 text-left">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Current Weight
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white font-sans">{currentWeight || '--'}</span>
            <span className="text-xs font-semibold text-slate-400">{unit}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-900 border border-white/10 text-left">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Goal Weight
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-lime font-sans">{targetWeight || '--'}</span>
            <span className="text-xs font-semibold text-slate-400">{unit}</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-dark-900 border border-white/10 text-left">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Remaining Delta
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-sky-400 font-sans">{weightDifference || 0}</span>
            <span className="text-xs font-semibold text-slate-400">{unit} to go</span>
          </div>
        </div>
      </div>

      {/* Weight Progress Chart Section */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Scale className="w-4 h-4 text-lime" />
              <span>Weight Progress Curve</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Scale check-ins and body recomp trend</p>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsWeightModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Check-in
          </Button>
        </div>

        <WeightChart
          logs={weightLogs}
          targetWeight={targetWeight}
          unit={unit}
        />
      </div>

      {/* Check-in History & Progress Photos */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span>Check-in Logs &amp; Photos ({weightLogs.length})</span>
        </h2>

        {weightLogs.length > 0 ? (
          <div className="divide-y divide-white/[0.04]">
            {weightLogs.slice().reverse().map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {log.photo_url ? (
                    <img
                      src={log.photo_url}
                      alt="Check-in thumbnail"
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-dark-850 flex items-center justify-center text-slate-500 border border-white/5 shrink-0">
                      <Scale className="w-5 h-5 text-slate-400" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm">
                      {log.weight_kg} {unit}
                      {log.body_fat_percentage && (
                        <span className="text-xs font-normal text-amber-400 ml-2">
                          ({log.body_fat_percentage}% BF)
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatDisplayDate(log.date)}</p>
                    {log.notes && (
                      <p className="text-[11px] text-slate-300 italic truncate mt-0.5">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteWeight(log.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Delete weight entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-2">
            No check-in logs yet. Record your morning weight to populate your timeline.
          </p>
        )}
      </div>

      {/* Modal */}
      <WeightLoggerModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onWeightLogged={loadWeightHistory}
      />
    </div>
  );
};
