import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { nutritionService } from '../../services/nutritionService';
import { Droplets, Plus } from 'lucide-react';

export const WaterTracker = ({
  currentWaterMl,
  targetWaterMl,
  date,
  onWaterUpdated,
}) => {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [customMl, setCustomMl] = useState('');
  const [optimisticWater, setOptimisticWater] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Sync optimistic water when prop updates from network
  React.useEffect(() => {
    setOptimisticWater(null);
  }, [currentWaterMl]);

  const effectiveWater = optimisticWater !== null ? optimisticWater : (Number(currentWaterMl) || 0);
  const percentage = targetWaterMl > 0 ? Math.min(Math.round((effectiveWater / targetWaterMl) * 100), 100) : 0;

  const handleQuickAdd = async (amount) => {
    if (!user) return;
    const previous = effectiveWater;
    const nextVal = Math.max(0, previous + amount);

    // 1. Instant 0ms optimistic UI update
    setOptimisticWater(nextVal);
    setFeedback(amount > 0 ? `+${amount}ml` : `${amount}ml`);
    setTimeout(() => setFeedback(null), 1200);

    // 2. Silent background sync
    try {
      const { error } = await nutritionService.logWater(user.id, date, amount);
      if (error) {
        setOptimisticWater(previous);
        toastError(error.message || 'Failed to log water');
      } else if (onWaterUpdated) {
        onWaterUpdated();
      }
    } catch {
      setOptimisticWater(previous);
      toastError('Could not record water intake.');
    }
  };

  const handleCustomAdd = async (e) => {
    e.preventDefault();
    const amount = Number(customMl);
    if (!amount || amount <= 0) return;
    setCustomMl('');
    setShowCustom(false);
    await handleQuickAdd(amount);
  };

  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="rounded-2xl p-3.5 sm:p-4 bg-white/[0.03] border border-white/[0.08] text-left">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 transition-transform ${feedback ? 'scale-110 text-cyan-300' : ''}`}>
            <Droplets className="w-3.5 h-3.5 fill-current stroke-none" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Hydration Tracker</h3>
              {feedback && (
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-sky-400 text-dark-950 animate-bounce">
                  {feedback}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">{percentage}% of daily goal</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm sm:text-base font-extrabold text-sky-400 font-mono tracking-tight">
            {Number(effectiveWater).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-normal"> / {Number(targetWaterMl).toLocaleString()} ml</span>
        </div>
      </div>

      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mb-3">
        <div
          className="bg-gradient-to-r from-sky-500 to-sky-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(56,189,248,0.25)]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Quick Tap Pills - Clean 1-Row Layout */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleQuickAdd(250)}
          className="flex-1 py-1.5 px-2 rounded-xl bg-white/[0.04] hover:bg-sky-500/15 active:scale-95 border border-white/5 hover:border-sky-500/30 text-center transition-all group"
        >
          <span className="text-xs font-bold text-slate-200 group-hover:text-sky-400">+250ml</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickAdd(500)}
          className="flex-1 py-1.5 px-2 rounded-xl bg-white/[0.04] hover:bg-sky-500/15 active:scale-95 border border-white/5 hover:border-sky-500/30 text-center transition-all group"
        >
          <span className="text-xs font-bold text-slate-200 group-hover:text-sky-400">+500ml</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickAdd(750)}
          className="flex-1 py-1.5 px-2 rounded-xl bg-white/[0.04] hover:bg-sky-500/15 active:scale-95 border border-white/5 hover:border-sky-500/30 text-center transition-all group"
        >
          <span className="text-xs font-bold text-slate-200 group-hover:text-sky-400">+750ml</span>
        </button>

        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
            showCustom
              ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 border-white/5'
          }`}
          title="Custom amount"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {showCustom && (
        <form onSubmit={handleCustomAdd} className="flex gap-2 mt-2.5 pt-2 border-t border-white/5 animate-in fade-in">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Custom ml (e.g. 350)"
            value={customMl}
            onChange={(e) => setCustomMl(e.target.value)}
            className="flex-1 bg-[#07090f] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            autoFocus
          />
          <button
            type="submit"
            disabled={!customMl}
            className="px-3 py-1.5 bg-sky-500 text-dark-950 font-black rounded-xl text-xs hover:bg-sky-400 transition-colors disabled:opacity-40"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
};
