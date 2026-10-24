import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { activityService } from '../../services/activityService';
import { formatDateToISO, formatDistance } from '../../lib/utils';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { StepLoggerModal } from '../../components/activity/StepLoggerModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import {
  Footprints,
  MapPin,
  Flame,
  Clock,
  Plus,
  TrendingUp,
  Award,
} from 'lucide-react';

export const ActivityPage = () => {
  const { user, profile } = useAuth();
  const [todayActivity, setTodayActivity] = useState(null);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const today = formatDateToISO();
  const targetSteps = profile?.daily_step_target || 10000;
  const unit = profile?.unit_system || 'metric';

  const loadActivityData = useCallback(async () => {
    if (!user) return;
    try {
      // Get 7-day date range
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);

      const [todayRes, weekRes] = await Promise.all([
        activityService.getActivityByDate(user.id, today),
        activityService.getActivityRange(user.id, formatDateToISO(start), formatDateToISO(end)),
      ]);

      setTodayActivity(todayRes.data || null);
      setWeeklyLogs(weekRes.data || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    loadActivityData();
  }, [loadActivityData]);

  const currentSteps = todayActivity?.steps || 0;
  const currentDistance = todayActivity?.distance_km || 0;
  const currentCalories = todayActivity?.active_calories || 0;
  const currentMinutes = todayActivity?.duration_minutes || 0;

  const percentage = Math.min(Math.round((currentSteps / targetSteps) * 100), 100);

  // Prepare 7-day data for Recharts BarChart
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = formatDateToISO(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const log = weeklyLogs.find((l) => l.date === dateStr);
    last7Days.push({
      day: dayName,
      date: dateStr,
      steps: log ? log.steps : dateStr === today ? currentSteps : 0,
    });
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading activity logs..." size="lg" />;
  }

  return (
    <div className="space-y-4 text-left animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Footprints className="w-5 h-5 text-lime" />
            <span>Activity &amp; Steps</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Step volume, walking distance, and daily active cardio
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="self-start sm:self-auto font-bold shadow-lime-sm"
        >
          Log Steps
        </Button>
      </div>

      {/* Main Today Steps Ring / Hero Card - Compact Glance */}
      <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.03] border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-lime uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 border border-lime/30 inline-block mb-1.5">
              Today's Step Progress
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-white font-sans tracking-tight">
                {currentSteps.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ {targetSteps.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {percentage >= 100 ? (
                <span className="text-lime font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Daily step goal completed!
                </span>
              ) : (
                <span>{(targetSteps - currentSteps).toLocaleString()} steps remaining today</span>
              )}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center justify-center bg-white/[0.04] p-3 rounded-2xl border border-white/5 text-center min-w-[75px]">
            <span className="text-xl font-black text-lime font-mono">{percentage}%</span>
            <span className="text-[9px] text-slate-400 uppercase font-semibold">Goal</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-2 mt-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-lime to-lime-bright h-full rounded-full transition-all duration-700 shadow-lime-sm"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          title="Distance"
          value={formatDistance(currentDistance, unit).split(' ')[0]}
          unit={unit === 'imperial' ? 'mi' : 'km'}
          icon={<MapPin className="w-3.5 h-3.5 text-sky-400" />}
          iconBg="bg-sky-400/10"
        />

        <StatCard
          title="Active Burn"
          value={currentCalories.toLocaleString()}
          unit="kcal"
          icon={<Flame className="w-3.5 h-3.5 text-amber-400" />}
          iconBg="bg-amber-400/10"
        />

        <StatCard
          title="Active Time"
          value={currentMinutes}
          unit="min"
          icon={<Clock className="w-3.5 h-3.5 text-purple-400" />}
          iconBg="bg-purple-400/10"
        />
      </div>

      {/* 7-Day Step Trend Bar Chart - Compact & High-Contrast */}
      <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.03] border border-white/10 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-lime" />
            <span>7-Day Step Volume</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Target: {targetSteps.toLocaleString()}</span>
        </div>

        <div className="w-full h-56 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3144" vertical={false} opacity={0.4} />
              <XAxis
                dataKey="day"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#2a3144' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#2a3144' }}
                tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : `${val}`)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-dark-900 border border-white/10 p-2.5 rounded-xl shadow-xl text-left">
                        <p className="text-[10px] text-slate-400 font-semibold">{item.date}</p>
                        <p className="text-sm font-black text-lime">
                          {item.steps.toLocaleString()} <span className="text-[10px] text-slate-300 font-normal">steps</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={targetSteps}
                stroke="#a3e635"
                strokeDasharray="3 3"
                opacity={0.6}
              />
              <Bar dataKey="steps" fill="#bbf43d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Step Logger Modal */}
      <StepLoggerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onActivitySaved={loadActivityData}
        defaultDate={today}
        initialSteps={currentSteps}
      />
    </div>
  );
};
