import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { activityService } from '../../services/activityService';
import { formatDateToISO, formatDistance } from '../../lib/utils';
import { fastCache } from '../../lib/cache';
import { ActivitySkeleton } from '../../components/common/Skeleton';
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
  Award,
  Zap,
} from 'lucide-react';

export const ActivityPage = () => {
  const { user, profile } = useAuth();
  const { success } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const today = formatDateToISO();

  // Instant SWR state: populate synchronously from cache (0ms loading)
  const cachedToday = user ? fastCache.get(`activity:${user.id}:${today}`) : null;
  const [todayActivity, setTodayActivity] = useState(cachedToday || null);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(!cachedToday);

  const targetSteps = profile?.daily_step_target || 10000;
  const unit = profile?.unit_system || 'metric';

  const loadActivityData = useCallback(async () => {
    if (!user) return;
    try {
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

  // Handle Apple Health URL shortcut sync (?sync_steps=8500)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const syncParam = params.get('sync_steps') || params.get('steps');
    if (syncParam && user) {
      const numSteps = parseInt(syncParam, 10);
      if (!isNaN(numSteps) && numSteps > 0) {
        activityService
          .upsertActivity(user.id, {
            date: today,
            steps: numSteps,
          })
          .then(() => {
            success(`✨ Synced ${numSteps.toLocaleString()} steps from Apple Health!`);
            loadActivityData();
            // Clean URL query param without refreshing
            navigate('/app/activity', { replace: true });
          })
          .catch(() => {});
      }
    }
  }, [location.search, user, today, success, loadActivityData, navigate]);

  // Base steps already stored in DB for today
  const displaySteps = todayActivity?.steps || 0;
  const currentDistance =
    todayActivity?.distance_km !== undefined
      ? todayActivity.distance_km
      : Math.round(displaySteps * 0.00075 * 100) / 100;
  const currentCalories =
    todayActivity?.active_calories !== undefined
      ? todayActivity.active_calories
      : Math.round(displaySteps * 0.04);
  const currentMinutes =
    todayActivity?.duration_minutes !== undefined
      ? todayActivity.duration_minutes
      : Math.round(displaySteps / 100);

  const percentage = Math.min(Math.round((displaySteps / targetSteps) * 100), 100);

  // Prepare 7-day data for Recharts BarChart
  const last7Days = useMemo(() => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = formatDateToISO(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const log = weeklyLogs.find((l) => l.date === dateStr);
      list.push({
        day: dayName,
        date: dateStr,
        steps: log ? log.steps : dateStr === today ? displaySteps : 0,
      });
    }
    return list;
  }, [weeklyLogs, today, displaySteps]);

  const maxWeeklySteps = Math.max(...last7Days.map((d) => d.steps), targetSteps, 1000);

  if (isLoading && !todayActivity && weeklyLogs.length === 0) {
    return <ActivitySkeleton />;
  }

  return (
    <div className="space-y-4 text-left animate-in fade-in pb-12">
      {/* Sleek Minimal Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Footprints className="w-5 h-5 text-lime" />
            <span>Activity &amp; Steps</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-synced with Apple Health
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-lime/10 border border-lime/30 text-[11px] font-bold text-lime">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Live Sync</span>
        </div>
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
                {displaySteps.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ {targetSteps.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {percentage >= 100 ? (
                <span className="text-lime font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Daily step goal completed!
                </span>
              ) : (
                <span>{(targetSteps - displaySteps).toLocaleString()} steps remaining</span>
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

      {/* 3 Metric Cards - Redesigned to Never Truncate Text */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Distance Card */}
        <div className="rounded-2xl p-3 sm:p-4 bg-white/[0.03] border border-white/[0.07] text-left">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Distance
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-2xl font-black text-white font-sans">
              {formatDistance(currentDistance, unit).split(' ')[0]}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">
              {unit === 'imperial' ? 'mi' : 'km'}
            </span>
          </div>
        </div>

        {/* Calories Card */}
        <div className="rounded-2xl p-3 sm:p-4 bg-white/[0.03] border border-white/[0.07] text-left">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Calories
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-2xl font-black text-white font-sans">
              {currentCalories.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">
              kcal
            </span>
          </div>
        </div>

        {/* Active Time Card */}
        <div className="rounded-2xl p-3 sm:p-4 bg-white/[0.03] border border-white/[0.07] text-left">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Active Time
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-2xl font-black text-white font-sans">
              {currentMinutes}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">
              min
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Step Trend Bar Chart - Clean, No Silly 1,2,3 Ticks */}
      <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.03] border border-white/10 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-lime" />
            <span>7-Day Step Volume</span>
          </h2>
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
            Target: {targetSteps.toLocaleString()}
          </span>
        </div>

        <div className="w-full h-48 sm:h-56 pt-2">
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
                domain={[0, maxWeeklySteps]}
                tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : `${val}`)}
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
    </div>
  );
};
