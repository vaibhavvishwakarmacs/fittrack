import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { EXERCISE_VARIATIONS_BY_MUSCLE, MUSCLE_GROUPS } from '../../data/muscleData';
import { Dumbbell, Plus, Sparkles, Image, Check, ChevronRight, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { exerciseService } from '../../services/exerciseService';

export const ExerciseVariationPicker = ({
  isOpen,
  onClose,
  initialMuscle = 'chest',
  onSelectVariation,
}) => {
  const [selectedMuscle, setSelectedMuscle] = useState(initialMuscle);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New variation form state
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newTips, setNewTips] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);

  // Database-backed custom variations
  const [dbCustomVariations, setDbCustomVariations] = useState([]);

  useEffect(() => {
    if (initialMuscle) {
      setSelectedMuscle(initialMuscle);
    }
  }, [initialMuscle]);

  // Load custom variations from DB on modal open
  useEffect(() => {
    if (isOpen) {
      exerciseService.getCustomExercises().then((res) => {
        if (res.data) {
          setDbCustomVariations(res.data);
        }
      });
    }
  }, [isOpen]);

  const defaultVariations = EXERCISE_VARIATIONS_BY_MUSCLE[selectedMuscle] || [];
  const addedCustomForMuscle = dbCustomVariations.filter(
    (item) => (item.muscle || '').toLowerCase() === selectedMuscle.toLowerCase()
  );
  const allVariations = [...defaultVariations, ...addedCustomForMuscle];

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Use api.upload which handles multipart formData correctly
      const res = await api.upload(file);
      if (res && res.url) {
        setNewImageUrl(res.url);
      }
    } catch (err) {
      console.warn('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCustomVariation = async () => {
    if (!newName.trim()) return;

    setIsSavingDb(true);
    const customPayload = {
      name: newName.trim(),
      muscle: selectedMuscle,
      target: newTarget.trim() || `${selectedMuscle.toUpperCase()} Emphasis`,
      tips: newTips.trim() ? [newTips.trim()] : ['Perform with strict form and controlled tempo.'],
      image: newImageUrl || null,
      defaultRestSec: 90,
      isCustom: true,
    };

    try {
      const res = await exerciseService.createCustomExercise(customPayload);
      const saved = res.data || customPayload;

      setDbCustomVariations((prev) => [saved, ...prev]);
      onSelectVariation(saved, selectedMuscle);
      setIsCreatingNew(false);
      setNewName('');
      setNewTarget('');
      setNewTips('');
      setNewImageUrl('');
      onClose();
    } catch (err) {
      console.error('Failed to save custom variation:', err);
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleDeleteCustom = async (e, id) => {
    e.stopPropagation();
    await exerciseService.deleteCustomExercise(id);
    setDbCustomVariations((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Movement Variation"
      description="Pick an exercise variation or add a custom movement saved to your database"
      maxWidth="xl"
    >
      <div className="space-y-4 text-left">
        {/* Muscle selector pills */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Muscle / Target Group
          </label>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {MUSCLE_GROUPS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMuscle(m.id);
                  setIsCreatingNew(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedMuscle === m.id
                    ? 'bg-lime text-dark-950 font-bold shadow-lime-sm'
                    : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-white/5'
                }`}
              >
                {m.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Create Custom Form Toggle */}
        {isCreatingNew ? (
          <div className="p-4 rounded-2xl bg-dark-850 border border-lime/30 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-lime" />
                <span>Add Custom Variation for {selectedMuscle.toUpperCase()}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back to List
              </button>
            </div>

            <Input
              label="Variation / Movement Name"
              placeholder="e.g. Incline Smith Machine Press"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <Input
              label="Specific Anatomy / Target Focus"
              placeholder="e.g. Upper Pectorals & Front Delts"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
            />

            <Input
              label="Form Tip or Coaching Cue"
              placeholder="e.g. Touch 2 inches below clavicle, 3s descent"
              value={newTips}
              onChange={(e) => setNewTips(e.target.value)}
            />

            {/* Optional Image */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Exercise Photo (Uploaded to Cloudinary)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-dark-800 file:text-lime hover:file:bg-dark-750 cursor-pointer"
                />
                {isUploading && <span className="text-xs text-lime animate-pulse font-semibold">Uploading to Cloudinary...</span>}
              </div>
              {newImageUrl && (
                <div className="mt-2">
                  <img
                    src={newImageUrl}
                    alt="Preview"
                    className="w-20 h-20 rounded-xl object-cover border border-white/10"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingNew(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveCustomVariation}
                disabled={!newName.trim() || isSavingDb || isUploading}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                {isSavingDb ? 'Saving to Database...' : 'Save to DB & Select'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Available Variations ({allVariations.length})
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="text-xs font-bold text-lime hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Custom Variation (Saves to DB)</span>
              </button>
            </div>

            {/* Variations list */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
              {allVariations.map((v, idx) => (
                <div
                  key={v.id || idx}
                  onClick={() => {
                    onSelectVariation(v, selectedMuscle);
                    onClose();
                  }}
                  className="p-3.5 rounded-2xl bg-dark-850 hover:bg-dark-800 border border-white/5 hover:border-lime/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {v.image ? (
                      <img
                        src={v.image}
                        alt={v.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-dark-900 border border-white/5 flex items-center justify-center text-lime shrink-0">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-lime transition-colors truncate">
                          {v.name}
                        </h4>
                        {v.isCustom && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Saved in DB
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{v.target}</p>
                      {v.tips?.[0] && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 italic mt-0.5">
                          "{v.tips[0]}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {v.isCustom && v.id && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustom(e, v.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete from DB"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-lime shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
