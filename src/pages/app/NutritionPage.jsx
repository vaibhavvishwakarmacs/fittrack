import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { nutritionService } from '../../services/nutritionService';
import { formatDateToISO, formatDisplayDate } from '../../lib/utils';
import { MacroRing } from '../../components/nutrition/MacroRing';
import { WaterTracker } from '../../components/nutrition/WaterTracker';
import { FoodLoggerModal } from '../../components/nutrition/FoodLoggerModal';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Utensils,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Coffee,
  Moon,
  Cookie,
} from 'lucide-react';

export const NutritionPage = () => {
  const { user, profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => formatDateToISO());
  const [logs, setLogs] = useState([]);
  const [waterMl, setWaterMl] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState('breakfast');

  const loadNutrition = useCallback(async () => {
    if (!user) return;
    try {
      const [nutRes, waterRes] = await Promise.all([
        nutritionService.getNutritionLogs(user.id, selectedDate),
        nutritionService.getWaterLogs(user.id, selectedDate),
      ]);
      setLogs(nutRes.data || []);
      setWaterMl(waterRes.totalMl || 0);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    loadNutrition();
  }, [loadNutrition]);

  const handleDeleteItem = async (logId) => {
    if (!user) return;
    await nutritionService.deleteFoodLog(user.id, logId);
    loadNutrition();
  };

  const handleOpenAddModal = (meal) => {
    setActiveMealType(meal);
    setIsFoodModalOpen(true);
  };

  // Date shifting
  const changeDateByDays = (days) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + days);
    setSelectedDate(formatDateToISO(dateObj));
  };

  // Aggregates
  const totalCalories = logs.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalProtein = logs.reduce((acc, curr) => acc + Number(curr.protein_g || 0), 0);
  const totalCarbs = logs.reduce((acc, curr) => acc + Number(curr.carbs_g || 0), 0);
  const totalFat = logs.reduce((acc, curr) => acc + Number(curr.fat_g || 0), 0);

  const targetCalories = profile?.daily_calorie_target || 2200;
  const targetProtein = profile?.daily_protein_target_g || 140;
  const targetCarbs = profile?.daily_carbs_target_g || 230;
  const targetFat = profile?.daily_fat_target_g || 65;
  const targetWater = profile?.daily_water_target_ml || 2500;

  const mealConfigs = [
    { type: 'breakfast', title: 'Breakfast', icon: Coffee, iconColor: 'text-amber-400' },
    { type: 'lunch', title: 'Lunch', icon: Sun, iconColor: 'text-lime' },
    { type: 'dinner', title: 'Dinner', icon: Moon, iconColor: 'text-sky-400' },
    { type: 'snack', title: 'Snacks & Extras', icon: Cookie, iconColor: 'text-purple-400' },
  ];

  if (isLoading) {
    return <LoadingSpinner label="Loading daily nutrition..." size="lg" />;
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Utensils className="w-6 h-6 text-lime" />
            <span>Nutrition Diary</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log whole foods, track calories and balance macronutrients
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-dark-900 border border-white/10 p-1 rounded-2xl">
          <button
            onClick={() => changeDateByDays(-1)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-white px-2 min-w-[100px] text-center">
            {formatDisplayDate(selectedDate)}
          </span>
          <button
            onClick={() => changeDateByDays(1)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {selectedDate !== formatDateToISO() && (
            <button
              onClick={() => setSelectedDate(formatDateToISO())}
              className="px-2 py-1 bg-lime text-dark-950 text-[10px] font-black rounded-lg ml-1"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Macro Ring / Target Bars */}
      <MacroRing
        calories={totalCalories}
        targetCalories={targetCalories}
        protein={totalProtein}
        targetProtein={targetProtein}
        carbs={totalCarbs}
        targetCarbs={targetCarbs}
        fat={totalFat}
        targetFat={targetFat}
      />

      {/* 4 Meal Category Sections */}
      <div className="space-y-2.5">
        {mealConfigs.map(({ type, title, icon: Icon, iconColor }) => {
          const mealLogs = logs.filter((l) => l.meal_type === type);
          const mealCalories = mealLogs.reduce((acc, l) => acc + (l.calories || 0), 0);

          return (
            <div
              key={type}
              className={`rounded-2xl transition-all border ${
                mealLogs.length > 0
                  ? 'p-4 sm:p-5 bg-white/[0.03] border-white/10 space-y-3'
                  : 'p-3 bg-white/[0.015] hover:bg-white/[0.03] border-white/5 flex items-center justify-between'
              }`}
            >
              {mealLogs.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl bg-white/5 ${iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
                        <p className="text-[11px] text-slate-400">
                          {mealCalories} kcal • {mealLogs.length} {mealLogs.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenAddModal(type)}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Food
                    </Button>
                  </div>

                  {/* Items list */}
                  <div className="divide-y divide-white/[0.04] pt-1">
                    {mealLogs.map((item) => (
                      <div
                        key={item.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {(item.photo_url || item.photoUrl) && (
                            <img
                              src={item.photo_url || item.photoUrl}
                              alt={item.food_name}
                              className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{item.food_name}</p>
                            <p className="text-[10px] text-slate-400">
                              {item.serving_size} •{' '}
                              <span className="text-sky-400">{item.protein_g}g P</span> •{' '}
                              <span className="text-amber-400">{item.carbs_g}g C</span> •{' '}
                              <span className="text-rose-400">{item.fat_g}g F</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-amber-400 text-sm">
                            {item.calories} <span className="text-[10px] text-slate-400 font-normal">kcal</span>
                          </span>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete food entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg bg-white/5 ${iconColor}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">{title}</span>
                    <span className="text-[10px] text-slate-500">• 0 kcal</span>
                  </div>

                  <button
                    onClick={() => handleOpenAddModal(type)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-[11px] font-bold text-lime border border-white/5 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Log</span>
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Water Tracker for this date */}
      <WaterTracker
        currentWaterMl={waterMl}
        targetWaterMl={targetWater}
        date={selectedDate}
        onWaterUpdated={loadNutrition}
      />

      {/* Add Food Modal */}
      <FoodLoggerModal
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        onFoodLogged={loadNutrition}
        defaultDate={selectedDate}
        defaultMeal={activeMealType}
      />
    </div>
  );
};
