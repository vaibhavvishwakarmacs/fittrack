import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../contexts/ToastContext';
import { formatDisplayDate } from '../../lib/utils';
import { formatSetDisplay } from '../../services/exerciseService';
import {
  enrichWorkoutWithTimestamps,
  formatTimeOnly,
  formatBreakDuration,
  downloadWorkoutPdf,
  shareWorkoutPdf,
  generateWorkoutPdfBlob,
} from '../../services/workoutPdfService';
import {
  FileText,
  Share2,
  Download,
  Printer,
  Clock,
  Dumbbell,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Timer,
  Coffee,
} from 'lucide-react';

export const WorkoutPdfModal = ({
  isOpen,
  onClose,
  workout,
  unit = 'kg',
  athleteName = 'FitTrack Athlete',
}) => {
  const { success, error: toastError } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !workout) return null;

  const enriched = enrichWorkoutWithTimestamps(workout);

  const totalVolume = Number(enriched.total_volume_kg || enriched.totalVolumeKg || 0);
  const caloriesBurned = Number(enriched.calories_burned || enriched.caloriesBurned || 0);
  const duration = enriched.durationMinutes || 45;

  let totalSets = 0;
  let totalReps = 0;
  let totalBreakSec = 0;

  (enriched.enrichedExercises || []).forEach((ex) => {
    (ex.sets || []).forEach((s) => {
      if (s.isCompleted || s.is_completed) {
        totalSets += 1;
        totalReps += Number(s.reps) || 0;
        totalBreakSec += Number(s.restDurationSec) || 90;
      }
    });
  });

  const handleShare = async () => {
    setIsExporting(true);
    try {
      const result = await shareWorkoutPdf(workout, { unit, athleteName });
      if (result.cancelled) {
        // user dismissed share sheet
        return;
      }
      if (result.method === 'native') {
        success('Workout PDF shared successfully!');
      } else {
        success('Workout PDF downloaded to your device!');
      }
    } catch (err) {
      toastError(err?.message || 'Failed to share workout PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    try {
      const fileName = downloadWorkoutPdf(workout, { unit, athleteName });
      success(`Downloaded ${fileName}!`);
    } catch (err) {
      toastError(err?.message || 'Failed to generate PDF.');
    }
  };

  const handlePrint = () => {
    try {
      const { blob } = generateWorkoutPdfBlob(workout, { unit, athleteName });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      toastError(err?.message || 'Failed to open printable PDF.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Workout Summary PDF"
      description="Official performance ledger with timestamps, set times, and break intervals"
      maxWidth="xl"
    >
      <div className="space-y-4 text-left">
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-2xl border border-lime/30 bg-gradient-to-br from-lime/10 via-dark-900 to-dark-950 p-4 shadow-[0_0_25px_rgba(187,244,61,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-lime/20 text-lime border border-lime/30 text-[10px] font-bold uppercase tracking-wider">
                  {enriched.category || 'Strength'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {formatDisplayDate(enriched.startedDate.toISOString().split('T')[0])}
                </span>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                {enriched.title || 'Completed Workout'}
              </h3>
              {enriched.notes && (
                <p className="text-xs text-slate-300 mt-1 italic">
                  "{enriched.notes}"
                </p>
              )}
            </div>

            <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Session</span>
            </span>
          </div>

          {/* Session Timestamps Banner */}
          <div className="mt-3 p-2.5 rounded-xl bg-dark-950/80 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-semibold">Session Window:</span>
              <span className="font-mono text-white font-bold">
                {formatTimeOnly(enriched.startedDate, false)} – {formatTimeOnly(enriched.completedDate, false)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Timer className="w-3.5 h-3.5 text-lime shrink-0" />
              <span className="font-semibold">Session Duration:</span>
              <span className="font-mono text-lime font-bold">{duration} min</span>
            </div>
          </div>

          {/* 4 KPI Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 text-center">
            <div className="p-2.5 rounded-xl bg-dark-900/90 border border-white/5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Volume</span>
              <span className="text-sm font-black text-lime font-mono flex items-center justify-center gap-1 mt-0.5">
                <Dumbbell className="w-3.5 h-3.5 text-lime" />
                {totalVolume.toLocaleString()} {unit}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-dark-900/90 border border-white/5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Sets &amp; Reps</span>
              <span className="text-sm font-black text-orange-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-orange-400" />
                {totalSets}s ({totalReps}r)
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-dark-900/90 border border-white/5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Total Breaks</span>
              <span className="text-sm font-black text-sky-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                <Coffee className="w-3.5 h-3.5 text-sky-400" />
                {Math.round(totalBreakSec / 60)} min
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-dark-900/90 border border-white/5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Burned</span>
              <span className="text-sm font-black text-amber-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {caloriesBurned} kcal
              </span>
            </div>
          </div>
        </div>

        {/* Exercises, Sets, Time & Break Ledger */}
        <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-lime" />
              <span>Exercise Breakdown &amp; Timestamps</span>
            </span>
            <span className="text-slate-400 text-[11px] font-normal">
              {(enriched.enrichedExercises || []).length} Movements
            </span>
          </div>

          {(enriched.enrichedExercises || []).map((ex, exIdx) => {
            const trackingFields = ex.tracking_fields || ex.trackingFields || ['weight', 'reps'];

            return (
              <div
                key={exIdx}
                className="p-3 rounded-2xl bg-dark-900/80 border border-white/10 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-lime/10 text-lime font-bold text-[11px] flex items-center justify-center">
                      {exIdx + 1}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {ex.exercise_name || ex.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">
                    {ex.exercise_category || ex.category || 'Movement'} • {(ex.sets || []).length} sets
                  </span>
                </div>

                {/* Sets Table */}
                <div className="rounded-xl overflow-hidden border border-white/5">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.04] text-[10px] text-slate-400 uppercase font-bold">
                      <tr>
                        <th className="py-1.5 px-2.5">Set</th>
                        <th className="py-1.5 px-2">Type</th>
                        <th className="py-1.5 px-2">Load / Performance</th>
                        <th className="py-1.5 px-2">Time Done</th>
                        <th className="py-1.5 px-2 text-right">Break</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {(ex.sets || []).map((s, sIdx) => {
                        const support = s.support || 'normal';
                        const isLast = sIdx === (ex.sets || []).length - 1;

                        return (
                          <tr key={sIdx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-1.5 px-2.5 text-slate-300 font-semibold">
                              #{s.set_number || s.setNumber || sIdx + 1}
                            </td>
                            <td className="py-1.5 px-2">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-sans uppercase font-bold ${
                                  support === 'warmup'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : support === 'drop_set'
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : support === 'failure'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-white/5 text-slate-400'
                                }`}
                              >
                                {support.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 font-bold text-white">
                              {formatSetDisplay(s, trackingFields, unit)}
                            </td>
                            <td className="py-1.5 px-2 text-slate-300">
                              {formatTimeOnly(s.calculatedCompletedTime)}
                            </td>
                            <td className="py-1.5 px-2 text-right text-slate-400 text-[10px]">
                              {formatBreakDuration(s.restDurationSec)}
                              {isLast && ' (Next)'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleShare}
            isLoading={isExporting}
            leftIcon={<Share2 className="w-4 h-4" />}
            className="justify-center font-bold text-xs py-2.5 shadow-lime-sm"
          >
            Share PDF File
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleDownload}
            leftIcon={<Download className="w-4 h-4" />}
            className="justify-center font-bold text-xs py-2.5"
          >
            Download PDF
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className="justify-center font-bold text-xs py-2.5 text-slate-300 hover:text-white"
          >
            Print / Open
          </Button>
        </div>
      </div>
    </Modal>
  );
};
