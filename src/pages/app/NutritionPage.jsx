import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { nutritionService } from '../../services/nutritionService';
import { formatDateToISO, formatDisplayDate } from '../../lib/utils';
import { MacroRing } from '../../components/nutrition/MacroRing';
import { WaterTracker } from '../../components/nutrition/WaterTracker';
import { FoodLoggerModal } from '../../components/nutrition/FoodLoggerModal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { NutritionSkeleton } from '../../components/common/Skeleton';
import { ClickableImage } from '../../components/common/ImageViewerModal';
import { ShareCardModal } from '../../components/common/ShareCardModal';
import { Button } from '../../components/common/Button';
import {
  Utensils,
  Plus,
  Trash2,
  Pencil,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Coffee,
  Moon,
  Cookie,
} from 'lucide-react';

export const NutritionPage = () => {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();
  const [selectedDate, setSelectedDate] = useState(() => formatDateToISO());
  const [logs, setLogs] = useState([]);
  const [waterMl, setWaterMl] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState('breakfast');
  const [editingFood, setEditingFood] = useState(null);
  const [sharingMeal, setSharingMeal] = useState(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleOpenAddModal = (meal) => {
    setEditingFood(null);
    setActiveMealType(meal);
    setIsFoodModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingFood(item);
    setActiveMealType(item.meal_type || item.mealType || 'lunch');
    setIsFoodModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await nutritionService.deleteFoodLog(user.id, deleteTarget.id);
      if (error) {
        toastError(error.message || 'Failed to delete food entry');
      } else {
        success(`Deleted "${deleteTarget.food_name || deleteTarget.foodName || 'Food'}"`);
        setDeleteTarget(null);
        loadNutrition();
      }
    } catch (err) {
      toastError(err?.message || 'Error deleting food entry');
    } finally {
      setIsDeleting(false);
    }
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

  // Sleek Skeleton state instead of jarring blank page
  if (isLoading && logs.length === 0) {
    return <NutritionSkeleton />;
  }

  return (
    <div className="space-y-4 text-left animate-in fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Utensils className="w-5 h-5 text-lime" />
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
                  ? 'p-3.5 sm:p-5 bg-white/[0.03] border-white/10 space-y-3'
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

                  {/* Items list with Edit, Share & Confirm Delete */}
                  <div className="divide-y divide-white/[0.04] pt-1">
                    {mealLogs.map((item) => (
                      <div
                        key={item.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {(item.photo_url || item.photoUrl) && (
                            <ClickableImage
                              src={item.photo_url || item.photoUrl}
                              alt={item.food_name || item.foodName}
                              title={item.food_name || item.foodName}
                              subtitle={`${item.calories} kcal • ${item.serving_size || item.servingSize || '1 serving'}`}
                              className="w-10 h-10 rounded-xl shrink-0"
                              imgClassName="w-10 h-10 rounded-xl object-cover border border-white/10"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{item.food_name || item.foodName}</p>
                            <p className="text-[10px] text-slate-400">
                              {item.serving_size || item.servingSize} •{' '}
                              <span className="text-sky-400">{item.protein_g ?? item.proteinG}g P</span> •{' '}
                              <span className="text-amber-400">{item.carbs_g ?? item.carbsG}g C</span> •{' '}
                              <span className="text-rose-400">{item.fat_g ?? item.fatG}g F</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-bold text-amber-400 text-sm mr-1">
                            {item.calories} <span className="text-[10px] text-slate-400 font-normal">kcal</span>
                          </span>

                          {/* Share Button */}
                          <button
                            onClick={() => setSharingMeal(item)}
                            className="p-1.5 text-slate-400 hover:text-lime rounded-lg hover:bg-lime/10 active:scale-95 transition-all"
                            title="Share meal photo card"
                            aria-label="Share meal"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 active:scale-95 transition-all"
                            title="Edit food entry"
                            aria-label="Edit food"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button with Confirmation */}
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 active:scale-95 transition-all"
                            title="Delete food entry"
                            aria-label="Delete food"
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

      {/* Add / Edit Food Modal */}
      <FoodLoggerModal
        isOpen={isFoodModalOpen}
        onClose={() => {
          setIsFoodModalOpen(false);
          setEditingFood(null);
        }}
        onFoodLogged={loadNutrition}
        defaultDate={selectedDate}
        defaultMeal={activeMealType}
        initialFood={editingFood}
      />

      {/* Confirmation Modal on Delete */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Food Entry"
        itemName={deleteTarget?.food_name || deleteTarget?.foodName}
        message="Are you sure you want to delete this food entry? This will adjust your daily calories and macros."
        isDeleting={isDeleting}
      />

      {/* Share Meal Card Modal */}
      <ShareCardModal
        isOpen={Boolean(sharingMeal)}
        onClose={() => setSharingMeal(null)}
        type="meal"
        data={sharingMeal ? {
          food_name: sharingMeal.food_name || sharingMeal.foodName,
          serving_size: sharingMeal.serving_size || sharingMeal.servingSize,
          calories: sharingMeal.calories,
          protein_g: sharingMeal.protein_g ?? sharingMeal.proteinG ?? 0,
          carbs_g: sharingMeal.carbs_g ?? sharingMeal.carbsG ?? 0,
          fat_g: sharingMeal.fat_g ?? sharingMeal.fatG ?? 0,
          photo_url: sharingMeal.photo_url || sharingMeal.photoUrl,
          meal_type: sharingMeal.meal_type || sharingMeal.mealType,
          date: selectedDate,
        } : {}}
      />
    </div>
  );
};
