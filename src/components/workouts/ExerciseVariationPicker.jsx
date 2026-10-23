import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { EXERCISE_VARIATIONS_BY_MUSCLE, MUSCLE_GROUPS } from '../../data/muscleData';
import { Dumbbell, Plus, Sparkles, Image, Check, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';

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

  // Local state for custom variations added this session
  const [customVariations, setCustomVariations] = useState({});

  const defaultVariations = EXERCISE_VARIATIONS_BY_MUSCLE[selectedMuscle] || [];
  const addedVariations = customVariations[selectedMuscle] || [];
  const allVariations = [...defaultVariations, ...addedVariations];

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData);
      if (res.url) {
        setNewImageUrl(res.url);
      }
    } catch (err) {
      console.warn('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCustomVariation = () => {
    if (!newName.trim()) return;

    const customObj = {
      name: newName.trim(),
      target: newTarget.trim() || `${selectedMuscle.toUpperCase()} Emphasis`,
      tips: newTips.trim() ? [newTips.trim()] : ['Perform with strict form and controlled tempo.'],
      image: newImageUrl || null,
      defaultRestSec: 90,
      isCustom: true,
    };

    setCustomVariations((prev) => ({
      ...prev,
      [selectedMuscle]: [...(prev[selectedMuscle] || []), customObj],
    }));

    onSelectVariation(customObj, selectedMuscle);
    setIsCreatingNew(false);
    setNewName('');
    setNewTarget('');
    setNewTips('');
    setNewImageUrl('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Movement Variation"
      description="Pick an exercise variation or add a custom movement with demonstration image"
      maxWidth="xl"
    >
      <div className="space-y-4 text-left">
        {/* Muscle selector pills */}
        <div>
          <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
            Muscle Group
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
                Exercise Photo or Image Demonstration (Optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-dark-800 file:text-lime hover:file:bg-dark-750 cursor-pointer"
                />
                {isUploading && <span className="text-xs text-lime animate-pulse">Uploading...</span>}
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
                disabled={!newName.trim()}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Save &amp; Select
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
                <span>+ Custom Variation</span>
              </button>
            </div>

            {/* Variations list */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
              {allVariations.map((v, idx) => (
                <div
                  key={idx}
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
                            Custom
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

                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-lime shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
