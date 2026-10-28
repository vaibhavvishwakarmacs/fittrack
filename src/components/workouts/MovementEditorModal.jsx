import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ClickableImage } from '../common/ImageViewerModal';
import { MUSCLE_GROUPS } from '../../data/muscleData';
import { exerciseService, TRACKING_FIELD_OPTIONS, TRACKING_PRESETS } from '../../services/exerciseService';
import { api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import {
  Sparkles,
  Dumbbell,
  Timer,
  RotateCcw,
  Check,
  Flame,
  Footprints,
  RotateCw,
  Sliders,
  Layers,
  Upload,
} from 'lucide-react';

export const MovementEditorModal = ({
  isOpen,
  onClose,
  movement = null,
  isLiveSession = false,
  onSaveMovement, // callback with updated movement object and scope ('session' | 'master')
  onResetPreset,  // optional callback when user resets preset override
}) => {
  const { success, error: toastError } = useToast();

  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('chest');
  const [target, setTarget] = useState('');
  const [tips, setTips] = useState('');
  const [image, setImage] = useState('');
  const [defaultRestSec, setDefaultRestSec] = useState(90);
  const [trackingFields, setTrackingFields] = useState(['weight', 'reps']);

  // Scope: 'session' | 'master'
  const [saveScope, setSaveScope] = useState(isLiveSession ? 'session' : 'master');

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (movement) {
      setName(movement.name || '');
      setMuscle(movement.muscle || movement.exercise_category || movement.category || 'chest');
      setTarget(movement.target || (movement.target_muscles || []).join(', ') || '');
      setTips(
        Array.isArray(movement.tips)
          ? movement.tips.join('\n')
          : typeof movement.tips === 'string'
          ? movement.tips
          : ''
      );
      setImage(movement.image || movement.image_url || movement.imageUrl || '');
      setDefaultRestSec(Number(movement.defaultRestSec || movement.default_rest_sec) || 90);

      const fields = movement.trackingFields || movement.tracking_fields;
      if (Array.isArray(fields) && fields.length > 0) {
        setTrackingFields(fields);
      } else {
        setTrackingFields(['weight', 'reps']);
      }

      setSaveScope(isLiveSession ? 'session' : 'master');
    }
  }, [movement, isLiveSession, isOpen]);

  const toggleTrackingField = (fieldId) => {
    setTrackingFields((prev) => {
      if (prev.includes(fieldId)) {
        if (prev.length <= 1) {
          toastError('Movement must track at least one unit.');
          return prev;
        }
        return prev.filter((f) => f !== fieldId);
      }
      return [...prev, fieldId];
    });
  };

  const applyTrackingPreset = (presetFields) => {
    setTrackingFields(presetFields);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await api.upload(file, { category: 'gym' });
      if (res && res.url) {
        setImage(res.url);
        success('Movement photo uploaded!');
      }
    } catch (err) {
      toastError(err?.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!movement) return;
    const presetName = movement.originalPresetName || movement.name;
    setIsResetting(true);
    try {
      await exerciseService.resetPreset(presetName);
      success(`Reset "${presetName}" to factory defaults.`);
      if (onResetPreset) onResetPreset(presetName);
      onClose();
    } catch (err) {
      toastError(err?.message || 'Failed to reset preset.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Movement name is required.');
      return;
    }
    if (trackingFields.length === 0) {
      toastError('Please select at least one tracking unit.');
      return;
    }

    const tipsArray = tips
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    const updatedMovement = {
      ...(movement || {}),
      name: name.trim(),
      muscle: muscle.toLowerCase(),
      target: target.trim() || `${muscle.toUpperCase()} Hypertrophy`,
      tips: tipsArray.length > 0 ? tipsArray : ['Maintain strict form and controlled tempo.'],
      image: image || null,
      defaultRestSec: Number(defaultRestSec) || 90,
      trackingFields,
      // If original preset or already an override, maintain original preset reference
      isPresetOverride: Boolean(movement?.isPreset || movement?.isPresetOverride || movement?.originalPresetName),
      originalPresetName: movement?.originalPresetName || (movement?.isPreset ? movement.name : null),
    };

    setIsSaving(true);
    try {
      // If saving to Master Library or editing from Master Movement Library
      if (saveScope === 'master' || !isLiveSession) {
        if (updatedMovement.id && !updatedMovement.id.startsWith('local-')) {
          await exerciseService.updateCustomExercise(updatedMovement.id, updatedMovement);
        } else {
          const res = await exerciseService.createCustomExercise(updatedMovement);
          if (res?.data?.id) {
            updatedMovement.id = res.data.id;
          }
        }
        success(`Saved "${updatedMovement.name}" to Master Movement Library!`);
      } else {
        success(`Updated "${updatedMovement.name}" for this session.`);
      }

      if (onSaveMovement) {
        onSaveMovement(updatedMovement, saveScope);
      }
      onClose();
    } catch (err) {
      toastError(err?.message || 'Error saving movement.');
    } finally {
      setIsSaving(false);
    }
  };

  const isPresetMovement = Boolean(movement?.isPreset || movement?.isPresetOverride || movement?.originalPresetName);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={movement ? `Edit Movement: ${movement.name}` : 'Edit Movement'}
      description="Configure movement name, muscle focus, form cues, rest timer, and tracking units"
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4 text-left">
        {/* Name & Muscle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="Movement Name"
              placeholder="e.g. Incline Dumbbell Press"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<Dumbbell className="w-4 h-4 text-lime" />}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Target Muscle Group
            </label>
            <select
              value={muscle}
              onChange={(e) => setMuscle(e.target.value)}
              className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-lime capitalize"
            >
              {MUSCLE_GROUPS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target Anatomy & Default Rest Timer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="Specific Anatomy / Focus"
              placeholder="e.g. Upper Pectorals, Clavicular Head"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>Default Rest Timer</span>
              <span className="text-lime font-mono">{defaultRestSec}s</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[45, 60, 90, 120, 180].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setDefaultRestSec(sec)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold font-mono transition-all border ${
                    defaultRestSec === sec
                      ? 'bg-lime text-dark-950 font-black border-lime shadow-lime-sm'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MULTI-UNIT TRACKING SECTION */}
        <div className="p-3.5 rounded-2xl bg-[#090c14] border border-lime/30 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-lime uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-lime" />
              <span>Tracking Units &amp; Metrics</span>
            </label>
            <span className="text-[10px] text-slate-400">
              {trackingFields.length} active {trackingFields.length === 1 ? 'unit' : 'units'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Choose which metrics you want to input and record for each set. You can combine multiple units freely!
          </p>

          {/* Quick 1-Tap Presets */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
              Quick Setup Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TRACKING_PRESETS.map((p, pIdx) => {
                const isActive =
                  p.fields.length === trackingFields.length &&
                  p.fields.every((f) => trackingFields.includes(f));
                return (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => applyTrackingPreset(p.fields)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all border ${
                      isActive
                        ? 'bg-lime text-dark-950 font-black border-lime shadow-lime-sm'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Individual Unit Toggle Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {TRACKING_FIELD_OPTIONS.map((opt) => {
              const isChecked = trackingFields.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleTrackingField(opt.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isChecked
                      ? 'bg-lime/15 border-lime/50 text-white shadow-lime-sm'
                      : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-xs font-black block truncate flex items-center gap-1.5">
                      {opt.id === 'weight' && <Dumbbell className="w-3.5 h-3.5 text-lime" />}
                      {opt.id === 'reps' && <RotateCw className="w-3.5 h-3.5 text-sky-400" />}
                      {opt.id === 'time' && <Timer className="w-3.5 h-3.5 text-amber-400" />}
                      {opt.id === 'distance' && <Footprints className="w-3.5 h-3.5 text-emerald-400" />}
                      {opt.id === 'calories' && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                      <span>{opt.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate">
                      {opt.defaultUnit}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                      isChecked
                        ? 'bg-lime border-lime text-dark-950 font-black'
                        : 'border-white/20 bg-dark-900'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Cues / Coaching Tips */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-lime" />
              <span>Form Cues &amp; Tips (one per line)</span>
            </span>
          </label>
          <textarea
            value={tips}
            onChange={(e) => setTips(e.target.value)}
            placeholder="e.g. Retract scapulae before pressing&#10;Tuck elbows at 45 degrees&#10;Pause 1s in the bottom stretch"
            rows={3}
            className="w-full bg-[#0a0d14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime"
          />
        </div>

        {/* Optional Demonstration Photo */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
            Movement Demonstration Photo
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="https://images.unsplash.com/... or upload below"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 cursor-pointer transition-colors shrink-0">
              <Upload className="w-3.5 h-3.5 text-lime" />
              <span>Upload Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </label>
          </div>
          {isUploading && (
            <p className="text-xs text-lime font-semibold animate-pulse mt-1">
              Uploading image to Cloudinary...
            </p>
          )}

          {image && (
            <div className="mt-2 flex items-center gap-2">
              <ClickableImage
                src={image}
                alt="Movement preview"
                title={name || 'Movement'}
                className="w-16 h-16 rounded-xl shrink-0"
                imgClassName="w-16 h-16 rounded-xl object-cover border border-white/10"
              />
              <button
                type="button"
                onClick={() => setImage('')}
                className="text-xs text-slate-400 hover:text-rose-400 underline"
              >
                Remove photo
              </button>
            </div>
          )}
        </div>

        {/* Live Session Scope Selector */}
        {isLiveSession && (
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Where should this change apply?
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSaveScope('session')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  saveScope === 'session'
                    ? 'bg-lime/15 border-lime text-white shadow-lime-sm'
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10'
                }`}
              >
                <span className="text-xs font-bold block text-white">This Session Only</span>
                <span className="text-[10px] text-slate-400">
                  Update active exercise sets without modifying the master library
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSaveScope('master')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  saveScope === 'master'
                    ? 'bg-lime/15 border-lime text-white shadow-lime-sm'
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10'
                }`}
              >
                <span className="text-xs font-bold block text-white flex items-center gap-1">
                  <Layers className="w-3 h-3 text-lime" />
                  <span>Save to Master Library</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Applies to this session and all future workout routines
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Reset Preset button if applicable */}
          {isPresetMovement && (
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={isResetting}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Reset this movement back to original factory defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isResetting ? 'Resetting...' : 'Reset to Factory Defaults'}</span>
            </button>
          )}

          <div className="flex items-center justify-end gap-2 ml-auto w-full sm:w-auto">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              leftIcon={<Check className="w-4 h-4" />}
              className="font-black shadow-lime-sm justify-center"
            >
              {saveScope === 'master' ? 'Save to Master Library' : 'Apply to Session'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
