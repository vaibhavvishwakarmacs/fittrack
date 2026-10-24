import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { nutritionService } from '../../services/nutritionService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateToISO } from '../../lib/utils';
import { Sparkles, Plus, Flame, Camera, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { api } from '../../lib/api';

const PRESET_MEALS = [
  { name: 'Grilled Chicken & Rice', mealType: 'lunch', serving: '200g bowl', cal: 460, p: 44, c: 48, f: 8 },
  { name: 'Whey Protein & Banana', mealType: 'snack', serving: '1 shake', cal: 280, p: 28, c: 32, f: 3 },
  { name: 'Oatmeal & Blueberries', mealType: 'breakfast', serving: '1 bowl', cal: 320, p: 10, c: 56, f: 6 },
  { name: 'Eggs & Avocado Toast', mealType: 'breakfast', serving: '2 eggs + toast', cal: 410, p: 19, c: 28, f: 22 },
  { name: 'Greek Yogurt & Honey', mealType: 'snack', serving: '200g', cal: 220, p: 22, c: 18, f: 4 },
  { name: 'Salmon & Sweet Potato', mealType: 'dinner', serving: '1 plate', cal: 520, p: 42, c: 38, f: 18 },
];

export const FoodLoggerModal = ({
  isOpen,
  onClose,
  onFoodLogged,
  defaultDate,
  defaultMeal = 'lunch',
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [date, setDate] = useState(defaultDate || formatDateToISO());
  const [mealType, setMealType] = useState(defaultMeal);
  const [foodName, setFoodName] = useState('');
  const [servingSize, setServingSize] = useState('1 serving');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [foodPhotoUrl, setFoodPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplyPreset = (preset) => {
    setFoodName(preset.name);
    setMealType(preset.mealType);
    setServingSize(preset.serving);
    setCalories(preset.cal);
    setProtein(preset.p);
    setCarbs(preset.c);
    setFat(preset.f);
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      // Uploads directly to Cloudinary folder: GYM/<user>/food
      const res = await api.upload(file, { category: 'food' });
      if (res && res.url) {
        setFoodPhotoUrl(res.url);
      }
    } catch (err) {
      toastError(err.message || 'Failed to upload food photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toastError('Please sign in to record food entries.');
      return;
    }
    if (!foodName.trim()) {
      toastError('Food name is required.');
      return;
    }
    if (calories === '' || Number(calories) < 0) {
      toastError('Please enter a valid calorie amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await nutritionService.addFoodLog(user.id, {
        date,
        mealType,
        foodName: foodName.trim(),
        servingSize: servingSize.trim() || '1 serving',
        calories: Number(calories),
        proteinG: Number(protein) || 0,
        carbsG: Number(carbs) || 0,
        fatG: Number(fat) || 0,
        photoUrl: foodPhotoUrl || null,
      });

      if (error) {
        toastError(error.message || 'Failed to save food log');
      } else {
        success(`Logged "${foodName}" (${calories} kcal)`);
        onFoodLogged();
        onClose();
        setFoodName('');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFat('');
        setFoodPhotoUrl('');
      }
    } catch (err) {
      toastError(err?.message || 'Error saving food entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Meal or Food"
      description="Record calories, macros, and photo into GYM food folder"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Meal Category
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-lime"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-lime" />
            <span>Frequent Fitness Meals (Quick Tap)</span>
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {PRESET_MEALS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="shrink-0 p-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/5 hover:border-lime/30 text-left transition-colors"
              >
                <p className="text-xs font-bold text-white whitespace-nowrap">{preset.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  <span className="text-amber-400 font-semibold">{preset.cal} kcal</span> • {preset.p}g P
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Food Name"
              placeholder="e.g. Brown Rice Bowl with Tuna"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              label="Serving Size"
              placeholder="1 cup / 200g"
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
            />
          </div>
        </div>

        {/* Calories and Macros */}
        <div className="p-3.5 rounded-2xl bg-dark-950 border border-white/10 space-y-3">
          <Input
            label="Total Calories (kcal)"
            type="number"
            placeholder="450"
            value={calories}
            onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
            leftIcon={<Flame className="w-4 h-4 text-amber-400" />}
            required
          />

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Protein (g)"
              type="number"
              step="0.1"
              placeholder="35"
              value={protein}
              onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label="Carbs (g)"
              type="number"
              step="0.1"
              placeholder="40"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label="Fat (g)"
              type="number"
              step="0.1"
              placeholder="12"
              value={fat}
              onChange={(e) => setFat(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>

        {/* Food Photo Upload Section */}
        <div className="p-3.5 rounded-2xl bg-dark-850/80 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-lime" />
              <span>Meal Photo (Optional)</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              Saved in GYM/food
            </span>
          </div>

          {foodPhotoUrl ? (
            <div className="relative inline-block mt-1">
              <img
                src={foodPhotoUrl}
                alt="Meal preview"
                className="w-24 h-24 rounded-2xl object-cover border border-lime/40 shadow-md"
              />
              <button
                type="button"
                onClick={() => setFoodPhotoUrl('')}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-colors"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-dark-900 hover:bg-dark-800 border border-white/10 text-xs font-bold text-slate-300 hover:text-white cursor-pointer active:scale-95 transition-all">
                <Camera className="w-4 h-4 text-lime" />
                <span>{isUploadingPhoto ? 'Uploading to Cloudinary...' : 'Add Meal Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>
              {isUploadingPhoto && <Loader2 className="w-4 h-4 text-lime animate-spin" />}
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-between items-center">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting || isUploadingPhoto}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Save Meal
          </Button>
        </div>
      </form>
    </Modal>
  );
};
