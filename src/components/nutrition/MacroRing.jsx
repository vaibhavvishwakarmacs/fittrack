import React from 'react';

export const MacroRing = ({
  calories,
  targetCalories,
  protein,
  targetProtein,
  carbs,
  targetCarbs,
  fat,
  targetFat,
}) => {
  const calPercent = targetCalories > 0 ? Math.min(Math.round((calories / targetCalories) * 100), 100) : 0;
  const pPercent = targetProtein > 0 ? Math.min(Math.round((protein / targetProtein) * 100), 100) : 0;
  const cPercent = targetCarbs > 0 ? Math.min(Math.round((carbs / targetCarbs) * 100), 100) : 0;
  const fPercent = targetFat > 0 ? Math.min(Math.round((fat / targetFat) * 100), 100) : 0;

  const remainingCalories = Math.max(targetCalories - calories, 0);

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] text-left">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calories Left</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {remainingCalories.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">kcal</span>
          </div>
        </div>

        <div className="text-right text-xs">
          <p className="text-slate-400 text-[11px]">Target: <span className="text-white font-bold">{targetCalories}</span></p>
          <p className="text-slate-400 text-[11px] mt-0.5">Eaten: <span className="text-lime font-bold">{calories}</span></p>
        </div>
      </div>

      <div className="my-3">
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-lime to-lime-bright h-full rounded-full transition-all duration-500 shadow-lime-sm"
            style={{ width: `${calPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1">
          <span>{calPercent}% consumed</span>
          <span>{calories} / {targetCalories} kcal</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-0.5">
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold text-sky-400 uppercase">Protein</span>
            <span className="text-[9px] text-slate-400 font-mono">{pPercent}%</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-white tracking-tight">
            {Math.round(protein)}<span className="text-[10px] text-slate-400 font-normal">/{targetProtein}g</span>
          </p>
          <div className="w-full bg-white/5 rounded-full h-1 mt-1.5 overflow-hidden">
            <div className="bg-sky-400 h-full rounded-full transition-all duration-500" style={{ width: `${pPercent}%` }} />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold text-amber-400 uppercase">Carbs</span>
            <span className="text-[9px] text-slate-400 font-mono">{cPercent}%</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-white tracking-tight">
            {Math.round(carbs)}<span className="text-[10px] text-slate-400 font-normal">/{targetCarbs}g</span>
          </p>
          <div className="w-full bg-white/5 rounded-full h-1 mt-1.5 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${cPercent}%` }} />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold text-rose-400 uppercase">Fat</span>
            <span className="text-[9px] text-slate-400 font-mono">{fPercent}%</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-white tracking-tight">
            {Math.round(fat)}<span className="text-[10px] text-slate-400 font-normal">/{targetFat}g</span>
          </p>
          <div className="w-full bg-white/5 rounded-full h-1 mt-1.5 overflow-hidden">
            <div className="bg-rose-400 h-full rounded-full transition-all duration-500" style={{ width: `${fPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
