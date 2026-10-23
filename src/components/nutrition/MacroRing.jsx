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
    <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 text-left">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calories Remaining</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {remainingCalories.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-400">kcal left</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400">Target: <span className="text-slate-200 font-bold">{targetCalories}</span></p>
          <p className="text-xs text-slate-400 mt-0.5">Eaten: <span className="text-lime font-bold">{calories}</span></p>
        </div>
      </div>

      <div className="mt-4 mb-5">
        <div className="w-full bg-dark-950 rounded-full h-3 overflow-hidden border border-white/5">
          <div
            className="bg-gradient-to-r from-lime to-lime-bright h-full rounded-full transition-all duration-500"
            style={{ width: `${calPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1.5">
          <span>{calPercent}% consumed</span>
          <span>{calories} / {targetCalories} kcal</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="p-3 rounded-2xl bg-dark-950/70 border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Protein</span>
            <span className="text-[10px] text-slate-400 font-medium">{pPercent}%</span>
          </div>
          <p className="text-base sm:text-lg font-black text-white tracking-tight">
            {Math.round(protein)} <span className="text-xs text-slate-400 font-normal">/ {targetProtein}g</span>
          </p>
          <div className="w-full bg-dark-850 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${pPercent}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-dark-950/70 border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Carbs</span>
            <span className="text-[10px] text-slate-400 font-medium">{cPercent}%</span>
          </div>
          <p className="text-base sm:text-lg font-black text-white tracking-tight">
            {Math.round(carbs)} <span className="text-xs text-slate-400 font-normal">/ {targetCarbs}g</span>
          </p>
          <div className="w-full bg-dark-850 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${cPercent}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-dark-950/70 border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Fat</span>
            <span className="text-[10px] text-slate-400 font-medium">{fPercent}%</span>
          </div>
          <p className="text-base sm:text-lg font-black text-white tracking-tight">
            {Math.round(fat)} <span className="text-xs text-slate-400 font-normal">/ {targetFat}g</span>
          </p>
          <div className="w-full bg-dark-850 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-rose-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${fPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
