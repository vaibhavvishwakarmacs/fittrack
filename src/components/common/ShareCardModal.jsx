import React, { useRef, useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { toPng, toBlob } from 'html-to-image';
import { useToast } from '../../contexts/ToastContext';
import {
  Share2,
  Download,
  Copy,
  Zap,
  Flame,
  Dumbbell,
  Clock,
  Scale,
  Footprints,
  Droplets,
  Calendar,
  Check,
  Loader2,
} from 'lucide-react';

// Converts remote/CORS images into inline base64 data URLs to prevent html-to-image blank canvas bugs
const convertImageToBase64 = async (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;

  // 1. First attempt: Server-side proxy which bypasses all browser CORS restrictions and canvas taint
  try {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const proxyUrl = `${apiBase}/upload/base64?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.dataUrl && data.dataUrl.startsWith('data:')) {
        return data.dataUrl;
      }
    }
  } catch (err) {
    // Fall back to client-side canvas
  }

  // 2. Client-side canvas conversion with cache-busting
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        resolve(dataUrl);
      } catch {
        fetchBlobAsBase64(url).then(resolve);
      }
    };

    img.onerror = () => {
      fetchBlobAsBase64(url).then(resolve);
    };

    const separator = url.includes('?') ? '&' : '?';
    img.src = `${url}${separator}t=${Date.now()}`;
  });
};

const fetchBlobAsBase64 = async (url) => {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const ShareCardModal = ({
  isOpen,
  onClose,
  type = 'meal', // 'meal' | 'workout' | 'daily' | 'checkin'
  data = {},
  unit = 'kg',
}) => {
  const cardRef = useRef(null);
  const { success, error: toastError } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [base64Photo, setBase64Photo] = useState(null);

  const rawPhoto = data?.photo_url || data?.photoUrl;
  const isPhotoLoading = Boolean(rawPhoto) && !base64Photo;

  useEffect(() => {
    if (!isOpen || !rawPhoto) {
      setBase64Photo(null);
      return;
    }

    if (rawPhoto.startsWith('data:')) {
      setBase64Photo(rawPhoto);
      return;
    }

    let isMounted = true;
    convertImageToBase64(rawPhoto).then((res) => {
      if (isMounted && res) {
        setBase64Photo(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, rawPhoto]);

  if (!isOpen || !data) return null;

  const prepareForCapture = async () => {
    if (rawPhoto && !base64Photo) {
      const converted = await convertImageToBase64(rawPhoto);
      if (converted) {
        setBase64Photo(converted);
        const imgEl = cardRef.current?.querySelector('img');
        if (imgEl) {
          imgEl.src = converted;
        }
      }
      await new Promise((r) => setTimeout(r, 120));
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      await prepareForCapture();
      const blob = await toBlob(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
      });

      if (!blob) throw new Error('Could not render image');

      const file = new File([blob], `FitTrack-${type}-${Date.now()}.png`, { type: 'image/png' });

      // Check if native Web Share API with files is supported (iOS Safari & Android Chrome)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `FitTrack ${type.toUpperCase()}`,
          text: `Check out my ${type} on FitTrack!`,
          files: [file],
        });
        success('Shared successfully!');
      } else {
        // Fallback: Trigger download
        const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2, cacheBust: true });
        const link = document.createElement('a');
        link.download = `FitTrack-${type}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        success('Fitness card saved to your device!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        toastError('Could not share image. You can use Download instead.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      await prepareForCapture();
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `FitTrack-${type}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      success('Card downloaded!');
    } catch (err) {
      toastError('Failed to generate image file.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      await prepareForCapture();
      const blob = await toBlob(cardRef.current, { quality: 0.95, pixelRatio: 2, cacheBust: true });
      if (blob && navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setHasCopied(true);
        success('Image copied to clipboard!');
        setTimeout(() => setHasCopied(false), 2500);
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Fitness Card"
      description="Save or share a photo card of your stats directly to Instagram, WhatsApp, or photos"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* The Visual Card to Capture */}
        <div className="overflow-x-auto flex justify-center py-2">
          <div
            ref={cardRef}
            className="w-[340px] sm:w-[360px] rounded-3xl bg-[#07090e] border border-white/15 p-5 text-left text-white shadow-2xl relative overflow-hidden flex flex-col justify-between"
            style={{
              backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(187, 244, 61, 0.08), transparent 40%), radial-gradient(circle at 90% 80%, rgba(56, 189, 248, 0.08), transparent 40%)',
            }}
          >
            {/* FitTrack Brand Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-lime to-lime-bright flex items-center justify-center text-dark-950 shadow-lime-sm font-black">
                  <Zap className="w-4 h-4 fill-current stroke-none" />
                </div>
                <div>
                  <span className="font-extrabold text-sm tracking-tight text-white">FitTrack</span>
                  <span className="text-[9px] text-lime font-black uppercase tracking-wider block">
                    {type === 'meal' ? 'Meal Log' : type === 'workout' ? 'Live Workout' : type === 'checkin' ? 'Body Check-in' : 'Daily Fitness'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{data.date || new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>

            {/* Content Based on Type */}
            {type === 'meal' && (
              <div className="py-3.5 space-y-3">
                {/* Meal Photo if Available */}
                {rawPhoto && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-dark-900 min-h-[176px] flex items-center justify-center">
                    {base64Photo ? (
                      <img
                        src={base64Photo}
                        alt={data.food_name || data.foodName || 'Meal photo'}
                        className="w-full h-44 object-cover"
                      />
                    ) : (
                      <div className="w-full h-44 flex flex-col items-center justify-center gap-2 bg-[#0c1018]">
                        <Loader2 className="w-6 h-6 text-lime animate-spin" />
                        <span className="text-[11px] text-slate-400 font-semibold tracking-wide">
                          Preparing meal photo...
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-400 font-bold text-[10px] uppercase border border-white/10">
                      {data.meal_type || data.mealType || 'Meal'}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-black text-white tracking-tight leading-snug">
                    {data.food_name || data.foodName || 'Meal Entry'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {data.serving_size || data.servingSize || '1 serving'}
                  </p>
                </div>

                {/* Big Calories Display */}
                <div className="flex items-baseline gap-1.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span className="text-3xl font-black text-white font-mono tracking-tight">
                    {data.calories}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">kcal total</span>
                </div>

                {/* Macros 3-Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
                    <span className="text-[10px] font-bold text-sky-400 uppercase block">Protein</span>
                    <span className="text-base font-black text-white font-mono">
                      {data.protein_g ?? data.proteinG ?? 0}g
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] font-bold text-amber-400 uppercase block">Carbs</span>
                    <span className="text-base font-black text-white font-mono">
                      {data.carbs_g ?? data.carbsG ?? 0}g
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[10px] font-bold text-rose-400 uppercase block">Fat</span>
                    <span className="text-base font-black text-white font-mono">
                      {data.fat_g ?? data.fatG ?? 0}g
                    </span>
                  </div>
                </div>
              </div>
            )}

            {type === 'workout' && (
              <div className="py-3.5 space-y-3">
                {rawPhoto && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-dark-900 min-h-[176px] flex items-center justify-center">
                    {base64Photo ? (
                      <img
                        src={base64Photo}
                        alt="Workout photo"
                        className="w-full h-44 object-cover"
                      />
                    ) : (
                      <div className="w-full h-44 flex flex-col items-center justify-center gap-2 bg-[#0c1018]">
                        <Loader2 className="w-6 h-6 text-lime animate-spin" />
                        <span className="text-[11px] text-slate-400 font-semibold tracking-wide">
                          Preparing workout photo...
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-lime font-bold text-[10px] uppercase border border-white/10">
                      {data.category || 'Workout'}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30 text-[10px] font-bold uppercase">
                      {data.category || 'Strength'}
                    </span>
                    {data.targetMuscles && data.targetMuscles.length > 0 && (
                      <span className="text-[10px] text-slate-400 truncate">
                        • {data.targetMuscles.join(', ')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {data.title || 'Completed Workout'}
                  </h3>
                  {data.notes && (
                    <p className="text-xs text-slate-400 mt-1 italic line-clamp-2">
                      "{data.notes}"
                    </p>
                  )}
                </div>

                {/* 3 Metric Banner */}
                <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">Duration</span>
                    <span className="text-base font-black text-white font-mono flex items-center justify-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      {data.duration_minutes || data.durationMinutes || 0}m
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">Volume</span>
                    <span className="text-base font-black text-lime font-mono flex items-center justify-center gap-1 mt-0.5">
                      <Dumbbell className="w-3.5 h-3.5 text-lime" />
                      {Number(data.total_volume_kg || data.totalVolumeKg || 0).toLocaleString()}{unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-semibold block">Burn</span>
                    <span className="text-base font-black text-amber-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      {data.calories_burned || data.caloriesBurned || 0}k
                    </span>
                  </div>
                </div>

                {data.exercises && data.exercises.length > 0 && (
                  <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">
                      Exercises Logged ({data.exercises.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {data.exercises.slice(0, 4).map((ex, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 font-medium">
                          {ex.exercise_name || ex.name}
                        </span>
                      ))}
                      {data.exercises.length > 4 && (
                        <span className="text-[10px] text-slate-400">+{data.exercises.length - 4} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {type === 'checkin' && (
              <div className="py-3.5 space-y-3">
                {/* Progress Photo if Available */}
                {rawPhoto && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-dark-900 min-h-[192px] flex items-center justify-center">
                    {base64Photo ? (
                      <img
                        src={base64Photo}
                        alt="Body check-in progress photo"
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 flex flex-col items-center justify-center gap-2 bg-[#0c1018]">
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                        <span className="text-[11px] text-slate-400 font-semibold tracking-wide">
                          Preparing progress photo...
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-purple-300 font-bold text-[10px] uppercase border border-white/10">
                      Weigh-in &amp; Progress
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {data.user_name || 'Athlete'} Scale Check-in
                  </h3>
                  {data.notes && (
                    <p className="text-xs text-slate-400 mt-1 italic">
                      "{data.notes}"
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <span className="text-[10px] font-bold text-purple-400 uppercase block">Weight</span>
                    <span className="text-2xl font-black text-white font-mono flex items-center justify-center gap-1 mt-0.5">
                      <Scale className="w-4 h-4 text-purple-400" />
                      {data.weight || data.current_weight_kg || '--'} {data.unit || 'kg'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-lime/10 border border-lime/20 text-center">
                    <span className="text-[10px] font-bold text-lime uppercase block">Body Fat</span>
                    <span className="text-2xl font-black text-white font-mono flex items-center justify-center gap-1 mt-0.5">
                      {data.body_fat ? `${data.body_fat}%` : 'Athletic'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {type === 'daily' && (
              <div className="py-3.5 space-y-3">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {data.user_name || 'Fitness'} Check-in
                  </h3>
                  <p className="text-xs text-slate-400">Daily movement and health stats</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <span className="text-[10px] font-bold text-purple-400 uppercase block">Weight</span>
                    <span className="text-2xl font-black text-white font-mono flex items-center justify-center gap-1 mt-0.5">
                      <Scale className="w-4 h-4 text-purple-400" />
                      {data.current_weight_kg || '--'} {unit}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-lime/10 border border-lime/20 text-center">
                    <span className="text-[10px] font-bold text-lime uppercase block">Steps</span>
                    <span className="text-2xl font-black text-white font-mono flex items-center justify-center gap-1 mt-0.5">
                      <Footprints className="w-4 h-4 text-lime" />
                      {Number(data.steps || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="text-[10px] font-bold text-amber-400 uppercase block">Active Burn</span>
                    <span className="text-xl font-black text-white font-mono flex items-center justify-center gap-1 mt-0.5">
                      <Flame className="w-4 h-4 text-amber-400" />
                      {data.calories_burned || 0} kcal
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
                    <span className="text-[10px] font-bold text-sky-400 uppercase block">Hydration</span>
                    <span className="text-xl font-black text-white font-mono flex items-center justify-center gap-1 mt-0.5">
                      <Droplets className="w-4 h-4 text-sky-400" />
                      {data.water_ml || 0} ml
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Verified FitTrack Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block" />
                Tracked with FitTrack
              </span>
              <span className="font-mono text-slate-500">fittrack.live</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button
            variant="primary"
            onClick={handleShare}
            isLoading={isGenerating}
            disabled={isPhotoLoading}
            leftIcon={isPhotoLoading ? <Loader2 className="w-4 h-4 animate-spin text-dark-950" /> : <Share2 className="w-4 h-4" />}
            className="justify-center font-bold text-xs py-2.5 shadow-lime-sm col-span-2 sm:col-span-1"
          >
            {isPhotoLoading ? 'Loading Photo...' : 'Share Photo'}
          </Button>

          <Button
            variant="secondary"
            onClick={handleDownload}
            disabled={isGenerating || isPhotoLoading}
            leftIcon={<Download className="w-4 h-4" />}
            className="justify-center font-bold text-xs py-2.5"
          >
            Save PNG
          </Button>

          <Button
            variant="ghost"
            onClick={handleCopy}
            disabled={isGenerating || isPhotoLoading}
            leftIcon={hasCopied ? <Check className="w-4 h-4 text-lime" /> : <Copy className="w-4 h-4" />}
            className="justify-center font-bold text-xs py-2.5"
          >
            {hasCopied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

