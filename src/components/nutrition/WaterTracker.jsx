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
  const { success, error: toastError } = useToast();
  const [customMl, setCustomMl] = useState('');

  const percentage = targetWaterMl > 0 ? Math.min(Math.round((currentWaterMl / targetWaterMl) * 100), 100) : 0;

  const handleQuickAdd = async (amount) => {
    if (!user) return;
    try {
      const { error } = await nutritionService.logWater(user.id, date, amount);
      if (error) {
        toastError(error.message || 'Failed to log water');
      } else {
        success(`+${amount} ml water logged!`);
        onWaterUpdated();
      }
    } catch {
      toastError('Could not record water intake.');
    }
  };

  const handleCustomAdd = async (e) => {
    e.preventDefault();
    const amount = Number(customMl);
    if (!amount || amount <= 0) return;
    await handleQuickAdd(amount);
    setCustomMl('');
  };

  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="rounded-2xl p-3.5 sm:p-4 bg-white/[0.03] border border-white/[0.08] text-left">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
            <Droplets className="w-3.5 h-3.5 fill-current stroke-none" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Hydration Tracker</h3>
            <p className="text-[10px] text-slate-400">{percentage}% of daily goal</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm sm:text-base font-extrabold text-sky-400 font-mono tracking-tight">
            {Number(currentWaterMl).toLocaleString()}
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
