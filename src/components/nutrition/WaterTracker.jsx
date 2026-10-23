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

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 text-left">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
            <Droplets className="w-4 h-4 fill-current stroke-none" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Hydration Tracker</h3>
            <p className="text-[11px] text-slate-400">Daily fluid intake</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base sm:text-lg font-black text-sky-400 font-sans tracking-tight">
            {Number(currentWaterMl).toLocaleString()} <span className="text-xs text-slate-400 font-semibold">/ {Number(targetWaterMl).toLocaleString()} ml</span>
          </p>
          <p className="text-[10px] text-slate-400 font-semibold">{percentage}% of goal</p>
        </div>
      </div>

      <div className="w-full bg-dark-950 rounded-full h-2.5 overflow-hidden mb-4 border border-white/5">
        <div
          className="bg-gradient-to-r from-sky-500 to-sky-400 h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <button
          type="button"
          onClick={() => handleQuickAdd(250)}
          className="py-2 px-1 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/5 hover:border-sky-500/30 text-center transition-all group"
        >
          <span className="block text-xs font-bold text-slate-200 group-hover:text-sky-400">+250ml</span>
          <span className="block text-[9px] text-slate-400 uppercase">Glass</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickAdd(500)}
          className="py-2 px-1 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/5 hover:border-sky-500/30 text-center transition-all group"
        >
          <span className="block text-xs font-bold text-slate-200 group-hover:text-sky-400">+500ml</span>
          <span className="block text-[9px] text-slate-400 uppercase">Bottle</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickAdd(750)}
          className="py-2 px-1 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/5 hover:border-sky-500/30 text-center transition-all group"
        >
          <span className="block text-xs font-bold text-slate-200 group-hover:text-sky-400">+750ml</span>
          <span className="block text-[9px] text-slate-400 uppercase">Shaker</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickAdd(1000)}
          className="py-2 px-1 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/5 hover:border-sky-500/30 text-center transition-all group"
        >
          <span className="block text-xs font-bold text-slate-200 group-hover:text-sky-400">+1000ml</span>
          <span className="block text-[9px] text-slate-400 uppercase">Jug</span>
        </button>
      </div>

      <form onSubmit={handleCustomAdd} className="flex gap-2">
        <input
          type="number"
          placeholder="Custom ml (e.g. 350)"
          value={customMl}
          onChange={(e) => setCustomMl(e.target.value)}
          className="flex-1 bg-dark-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
        />
        <button
          type="submit"
          disabled={!customMl}
          className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500 text-sky-400 hover:text-dark-950 rounded-xl text-xs font-bold border border-sky-500/30 transition-colors disabled:opacity-40"
        >
          <Plus className="w-4 h-4 inline" />
        </button>
      </form>
    </div>
  );
};
