import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { nutritionService } from '../../services/nutritionService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateToISO } from '../../lib/utils';
import {
  Sparkles,
  Plus,
  Flame,
  Camera,
  Loader2,
  X,
  Image as ImageIcon,
  Zap,
  Key,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Scan,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ClickableImage } from '../common/ImageViewerModal';
import { compressImage } from '../../lib/imageCompressor';
import { aiService } from '../../services/aiService';
import { AiKeyModal } from './AiKeyModal';

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
  initialFood = null,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const isEditMode = Boolean(initialFood && initialFood.id);

  const [date, setDate] = useState(defaultDate || formatDateToISO());
  const [mealType, setMealType] = useState(defaultMeal);
  const [foodName, setFoodName] = useState('');
  const [servingSize, setServingSize] = useState('1 serving');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [foodPhotoUrl, setFoodPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFileForAi, setSelectedFileForAi] = useState(null);
  const [localImagePreview, setLocalImagePreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Scanner state
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [pendingFileForAi, setPendingFileForAi] = useState(null);

  // Sync state whenever modal opens or initialFood changes
  React.useEffect(() => {
    if (initialFood) {
      setDate(initialFood.date || defaultDate || formatDateToISO());
      setMealType(initialFood.meal_type || initialFood.mealType || defaultMeal);
      setFoodName(initialFood.food_name || initialFood.foodName || '');
      setServingSize(initialFood.serving_size || initialFood.servingSize || '1 serving');
      setCalories(initialFood.calories !== undefined ? initialFood.calories : '');
      setProtein(initialFood.protein_g ?? initialFood.proteinG ?? '');
      setCarbs(initialFood.carbs_g ?? initialFood.carbsG ?? '');
      setFat(initialFood.fat_g ?? initialFood.fatG ?? '');
      setFoodPhotoUrl(initialFood.photo_url || initialFood.photoUrl || '');
      setNotes(initialFood.notes || initialFood.description || '');
      setSelectedFileForAi(null);
      setLocalImagePreview(null);
      setAiResult(null);
      setAiError(null);
    } else {
      setDate(defaultDate || formatDateToISO());
      setMealType(defaultMeal);
      setFoodName('');
      setServingSize('1 serving');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setFoodPhotoUrl('');
      setNotes('');
      setSelectedFileForAi(null);
      setLocalImagePreview(null);
      setAiResult(null);
      setAiError(null);
    }
  }, [initialFood, isOpen, defaultDate, defaultMeal]);

  const handleApplyPreset = (preset) => {
    setFoodName(preset.name);
    setMealType(preset.mealType);
    setServingSize(preset.serving);
    setCalories(preset.cal);
    setProtein(preset.p);
    setCarbs(preset.c);
    setFat(preset.f);
  };

  // Run AI food recognition & calorie/macro computation with user notes factored in
  const analyzeFoodWithAi = async ({ file, imageUrl, customKey, userNotes } = {}) => {
    const targetFile = file || selectedFileForAi || (pendingFileForAi instanceof File ? pendingFileForAi : null);
    const targetUrl = imageUrl || (typeof pendingFileForAi === 'string' ? pendingFileForAi : foodPhotoUrl);
    const activeNotes = (userNotes !== undefined ? userNotes : notes) || '';

    if (!targetFile && !targetUrl) {
      toastError('Please select or upload a food photo first.');
      return;
    }

    setIsAnalyzingAi(true);
    setAiError(null);

    try {
      const res = await aiService.analyzeFoodImage({
        file: targetFile,
        imageUrl: targetFile ? undefined : targetUrl,
        customKey,
        userNotes: activeNotes,
      });

      if (res?.requiresKey) {
        setPendingFileForAi(targetFile || targetUrl);
        setIsKeyModalOpen(true);
        toastError('Please add your free Google Gemini API key to enable instant AI food scanning.');
        return;
      }

      if (res?.success && res.data) {
        const d = res.data;
        if (d.food_name) setFoodName(d.food_name);
        if (d.serving_size) setServingSize(d.serving_size);
        if (d.calories !== undefined && d.calories !== null) setCalories(d.calories);
        if (d.protein_g !== undefined && d.protein_g !== null) setProtein(d.protein_g);
        if (d.carbs_g !== undefined && d.carbs_g !== null) setCarbs(d.carbs_g);
        if (d.fat_g !== undefined && d.fat_g !== null) setFat(d.fat_g);

        setAiResult(d);
        success(`✨ AI detected: ${d.food_name} (${d.calories} kcal, ${d.serving_size})!`);
      } else {
        const msg = res?.error || 'AI could not recognize nutrition details. You can enter them manually.';
        setAiError(msg);
        toastError(msg);
      }
    } catch (err) {
      console.error('[AI Food Scan Exception]:', err);
      let msg = err?.message || 'Failed to scan food with AI';
      if (msg === 'Load failed' || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        msg = 'Connection to AI scanner timed out or network error. Please try again.';
      }
      setAiError(msg);
      toastError(msg);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    // Set local preview immediately for rapid visual confirmation
    try {
      const previewUrl = URL.createObjectURL(rawFile);
      setLocalImagePreview(previewUrl);
    } catch {
      // ignore preview error
    }

    // Compress photo on mobile device to ensure fast upload and stay within limits
    const file = await compressImage(rawFile, 1200, 0.8);
    setSelectedFileForAi(file);

    // 1. Kick off AI Nutrition Vision Scan immediately with existing user notes!
    analyzeFoodWithAi({ file, userNotes: notes });

    // 2. Simultaneously upload to Cloudinary GYM food folder
    setIsUploadingPhoto(true);
    try {
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
      const payload = {
        date,
        mealType,
        foodName: foodName.trim(),
        servingSize: servingSize.trim() || '1 serving',
        calories: Number(calories),
        proteinG: Number(protein) || 0,
        carbsG: Number(carbs) || 0,
        fatG: Number(fat) || 0,
        photoUrl: foodPhotoUrl || null,
        notes: notes.trim(),
      };

      let result;
      if (isEditMode) {
        result = await nutritionService.updateFoodLog(user.id, initialFood.id, payload);
      } else {
        result = await nutritionService.addFoodLog(user.id, payload);
      }

      if (result.error) {
        toastError(result.error.message || `Failed to ${isEditMode ? 'update' : 'save'} food log`);
      } else {
        success(isEditMode ? `Updated "${foodName}"` : `Logged "${foodName}" (${calories} kcal)`);
        onFoodLogged();
        onClose();
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
      title={isEditMode ? 'Edit Food Entry' : 'Log Meal or Food'}
      description={isEditMode ? 'Update calories, macronutrients, or meal photo' : 'Record calories, macros, and photo into GYM food folder'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* ========================================================================= */}
        {/* AI Food & Calorie Vision Scanner Hero                                      */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl border border-lime/30 bg-gradient-to-br from-lime/10 via-dark-900 to-dark-950 p-4 shadow-[0_0_25px_rgba(187,244,61,0.08)]">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-lime/20 border border-lime/40 text-lime flex items-center justify-center shrink-0 shadow-lime-sm">
                <Zap className="w-4 h-4 fill-lime" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-white tracking-wide uppercase">
                    AI Food &amp; Macro Scanner
                  </h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-lime/20 text-lime border border-lime/30">
                    Free Gemini Flash
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Upload meal photo + add context notes for ultra-accurate macros
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsKeyModalOpen(true)}
              className="p-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/10 text-slate-300 hover:text-lime transition-colors"
              title="Configure AI API Key (Google Gemini / OpenAI)"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Context Notes for AI (Optional) */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-lime" />
                <span>Meal Details &amp; Notes for AI (Optional)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Oils, portions, weights
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='e.g., "Cooked in 1 tbsp olive oil, 2 rotis with 200g chicken", "2 scoops whey in 250ml whole milk"'
                className="w-full bg-dark-950/80 border border-white/10 focus:border-lime rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors pr-8"
              />
              {notes && (
                <button
                  type="button"
                  onClick={() => setNotes('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-white"
                  title="Clear notes"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick suggestion chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              <span className="text-[10px] text-slate-500 font-semibold shrink-0">Quick tap:</span>
              {[
                '+ 1 tbsp Olive Oil',
                '+ 2 Rotis',
                '+ 200g Chicken',
                '+ 2 Scoops Whey',
                '+ Cooked in Ghee',
                '+ Homemade / Low Oil',
                '+ Zero Sugar',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    const clean = chip.replace(/^\+\s*/, '');
                    setNotes((prev) => (prev ? `${prev}, ${clean}` : clean));
                  }}
                  className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white/5 hover:bg-lime/20 border border-white/10 hover:border-lime/40 text-slate-300 hover:text-lime transition-all active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* AI State: Analyzing */}
          {isAnalyzingAi && (
            <div className="p-4 rounded-xl bg-dark-950/90 border border-lime/40 flex flex-col items-center justify-center gap-2.5 text-center py-5 animate-pulse">
              <div className="relative">
                <Loader2 className="w-7 h-7 text-lime animate-spin" />
                <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">AI Vision Scanning Meal &amp; Factoring Notes...</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Detecting food items, adjusting portions for your notes, and computing precise macros
                </p>
              </div>
            </div>
          )}

          {/* AI State: Success Result Banner */}
          {!isAnalyzingAi && aiResult && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AI Recognized &amp; Auto-Filled</span>
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer transition-colors underline">
                    Change photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={isUploadingPhoto || isAnalyzingAi}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {(localImagePreview || foodPhotoUrl) && (
                  <ClickableImage
                    src={localImagePreview || foodPhotoUrl}
                    alt={aiResult.food_name}
                    title={aiResult.food_name}
                    subtitle={`${aiResult.calories} kcal • ${aiResult.serving_size}`}
                    className="w-16 h-16 rounded-xl shrink-0"
                    imgClassName="w-16 h-16 rounded-xl object-cover border border-emerald-500/40"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-white truncate">{aiResult.food_name}</p>
                  <p className="text-xs text-lime font-medium mt-0.5">
                    Serving: {aiResult.serving_size}
                  </p>
                </div>
              </div>

              {/* Detailed AI Description & Notes Factored Block */}
              {aiResult.description && (
                <div className="p-2.5 rounded-xl bg-dark-900/90 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-lime uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>AI Nutritional Breakdown</span>
                    </span>
                    {notes && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-lime/20 text-lime font-bold">
                        Context Factored
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    "{aiResult.description}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                <div className="p-1.5 rounded-lg bg-dark-900/90 border border-white/5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Calories</p>
                  <p className="text-xs font-black text-amber-400">{aiResult.calories}</p>
                </div>
                <div className="p-1.5 rounded-lg bg-dark-900/90 border border-white/5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Protein</p>
                  <p className="text-xs font-black text-rose-400">{aiResult.protein_g}g</p>
                </div>
                <div className="p-1.5 rounded-lg bg-dark-900/90 border border-white/5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Carbs</p>
                  <p className="text-xs font-black text-amber-300">{aiResult.carbs_g}g</p>
                </div>
                <div className="p-1.5 rounded-lg bg-dark-900/90 border border-white/5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Fat</p>
                  <p className="text-xs font-black text-sky-400">{aiResult.fat_g}g</p>
                </div>
              </div>

              {/* Re-calculate button with updated notes */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <p className="text-[10px] text-slate-400">
                  Tweak notes above anytime and re-calculate
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => analyzeFoodWithAi()}
                  isLoading={isAnalyzingAi}
                  leftIcon={<RefreshCw className="w-3 h-3 text-lime" />}
                  className="text-[11px] py-1 px-2.5 h-auto"
                >
                  Re-calculate with Notes
                </Button>
              </div>
            </div>
          )}

          {/* AI State: Photo Selected but not yet analyzed */}
          {!isAnalyzingAi && !aiResult && (localImagePreview || foodPhotoUrl || selectedFileForAi) && (
            <div className="p-3.5 rounded-xl bg-dark-950/80 border border-lime/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ClickableImage
                  src={localImagePreview || foodPhotoUrl}
                  alt="Selected meal photo"
                  title="Selected meal photo"
                  className="w-14 h-14 rounded-xl shrink-0"
                  imgClassName="w-14 h-14 rounded-xl object-cover border border-lime/40"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Photo Selected</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {notes ? 'Ready to analyze with your custom notes' : 'Add any notes above or calculate directly'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer px-2 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={isUploadingPhoto || isAnalyzingAi}
                    className="hidden"
                  />
                </label>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => analyzeFoodWithAi()}
                  isLoading={isAnalyzingAi}
                  leftIcon={<Zap className="w-3.5 h-3.5 fill-dark-950" />}
                  className="text-xs font-bold shadow-lime-sm"
                >
                  Analyze with AI
                </Button>
              </div>
            </div>
          )}

          {/* AI State: Idle Upload Prompt */}
          {!isAnalyzingAi && !aiResult && !localImagePreview && !foodPhotoUrl && !selectedFileForAi && (
            <label className="group flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-dark-950/70 hover:bg-dark-950 border border-dashed border-lime/40 hover:border-lime cursor-pointer transition-all active:scale-[0.99]">
              <div className="flex items-center gap-2 text-lime group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5" />
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-center">
                <p className="text-xs font-extrabold text-white group-hover:text-lime transition-colors">
                  📸 Upload Meal Photo for Instant AI Calculation
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm">
                  AI will identify the dish, read your notes above (portions, cooking oils), and compute accurate macros
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={isUploadingPhoto || isAnalyzingAi}
                className="hidden"
              />
            </label>
          )}

          {/* Error Banner */}
          {aiError && (
            <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-[11px]">{aiError}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                className="text-[11px] font-bold underline text-lime hover:text-white shrink-0 ml-2"
              >
                Set AI Key
              </button>
            </div>
          )}
        </div>

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
              label="Serving Size / Grams"
              placeholder="e.g. 1 pack (100g) or 250g plate"
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

        {/* Meal Notes / Preparation Details */}
        <div className="p-3.5 rounded-2xl bg-dark-950 border border-white/10 space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-lime" />
              <span>Meal Notes &amp; Preparation (Saved with Log)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Optional</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder='e.g., Cooked in 1 tbsp olive oil, 2 rotis with homemade paneer bhurji, 250ml milk'
            className="w-full bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime resize-none transition-colors"
          />
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

          {(foodPhotoUrl || localImagePreview) ? (
            <div className="flex items-center gap-3">
              <div className="relative inline-block mt-1">
                <ClickableImage
                  src={foodPhotoUrl || localImagePreview}
                  alt="Meal photo preview"
                  title={foodName || 'Meal photo preview'}
                  className="w-24 h-24 rounded-2xl object-cover border border-lime/40 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFoodPhotoUrl('');
                    setLocalImagePreview(null);
                    setSelectedFileForAi(null);
                  }}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-colors z-10"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Re-scan existing photo button with current notes */}
              <div className="space-y-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    analyzeFoodWithAi({
                      imageUrl: foodPhotoUrl,
                      file: selectedFileForAi,
                      userNotes: notes,
                    })
                  }
                  isLoading={isAnalyzingAi}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-lime" />}
                  className="text-xs"
                >
                  Re-scan with AI &amp; Notes
                </Button>
                <p className="text-[10px] text-slate-400">
                  {notes ? 'Factors your custom notes into the macro calculation' : 'Recomputes calories & macros from this photo'}
                </p>
              </div>
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

        <div className="pt-3 pb-1 flex justify-between items-center gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="px-5">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting || isUploadingPhoto}
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-1 sm:flex-initial justify-center font-bold shadow-lime-sm"
          >
            {isEditMode ? 'Update Food' : 'Save Meal'}
          </Button>
        </div>
      </form>

      {/* AI Key Configuration Modal */}
      <AiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={(key) => {
          if (pendingFileForAi) {
            analyzeFoodWithAi({
              file: pendingFileForAi instanceof File ? pendingFileForAi : null,
              imageUrl: typeof pendingFileForAi === 'string' ? pendingFileForAi : undefined,
              customKey: key,
            });
            setPendingFileForAi(null);
          }
        }}
      />
    </Modal>
  );
};
