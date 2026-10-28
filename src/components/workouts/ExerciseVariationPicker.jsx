import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ClickableImage } from '../common/ImageViewerModal';
import { EXERCISE_VARIATIONS_BY_MUSCLE, MUSCLE_GROUPS } from '../../data/muscleData';
import { exerciseService } from '../../services/exerciseService';
import { MovementEditorModal } from './MovementEditorModal';
import { MasterMovementLibraryModal } from './MasterMovementLibraryModal';
import { Dumbbell, Plus, Sparkles, Check, ChevronRight, Trash2, Pencil, Layers, Timer } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const ExerciseVariationPicker = ({
  isOpen,
  onClose,
  initialMuscle = 'chest',
  onSelectVariation,
}) => {
  const { success, error: toastError } = useToast();
  const [selectedMuscle, setSelectedMuscle] = useState(initialMuscle);

  // Database-backed custom variations & overrides
  const [dbCustomVariations, setDbCustomVariations] = useState([]);

  // Modals inside picker
  const [editingMovement, setEditingMovement] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMasterLibraryOpen, setIsMasterLibraryOpen] = useState(false);

  useEffect(() => {
    if (initialMuscle) {
      setSelectedMuscle(initialMuscle);
    }
  }, [initialMuscle]);

  const loadCustomData = useCallback(async () => {
    try {
      const res = await exerciseService.getCustomExercises();
      if (res?.data) {
        setDbCustomVariations(res.data);
      }
    } catch {
      // ignore
    }
  }, []);

  // Load custom variations from DB on modal open
  useEffect(() => {
    if (isOpen) {
      loadCustomData();
    }
  }, [isOpen, loadCustomData]);

  // Merge presets with user DB overrides & user custom exercises
  const variationsForMuscle = useMemo(() => {
    const merged = exerciseService.mergeMovementsWithOverrides(
      EXERCISE_VARIATIONS_BY_MUSCLE,
      dbCustomVariations
    );
    return merged[selectedMuscle] || [];
  }, [selectedMuscle, dbCustomVariations]);

  const handleDeleteCustom = async (e, id) => {
    e.stopPropagation();
    try {
      await exerciseService.deleteCustomExercise(id);
      success('Deleted custom movement');
      loadCustomData();
    } catch {
      toastError('Failed to delete movement');
    }
  };

  const handleEditMovement = (e, mov) => {
    e.stopPropagation();
    setEditingMovement({
      ...mov,
      muscle: mov.muscle || selectedMuscle,
    });
    setIsEditorOpen(true);
  };

  const handleCreateNew = () => {
    setEditingMovement({
      name: '',
      muscle: selectedMuscle,
      target: '',
      tips: [],
      image: null,
      defaultRestSec: 90,
      trackingFields: ['weight', 'reps'],
      isCustom: true,
      isPreset: false,
      isPresetOverride: false,
    });
    setIsEditorOpen(true);
  };

  const handleMovementSaved = (savedMovement) => {
    loadCustomData();
    if (savedMovement && savedMovement.name) {
      onSelectVariation(savedMovement, selectedMuscle);
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !isEditorOpen && !isMasterLibraryOpen}
        onClose={onClose}
        title="Select Movement Variation"
        description="Choose a movement, customize values & units, or open the Master Library"
        maxWidth="xl"
      >
        <div className="space-y-4 text-left">
          {/* Top Actions: Master Library Button & Create New */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsMasterLibraryOpen(true)}
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-lime" />
              <span>Master Movement Library</span>
            </button>

            <button
              type="button"
              onClick={handleCreateNew}
              className="text-xs font-bold text-lime hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Custom Movement</span>
            </button>
          </div>

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
                  onClick={() => setSelectedMuscle(m.id)}
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

          {/* Variations list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Available Variations ({variationsForMuscle.length})
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
              {variationsForMuscle.map((v, idx) => {
                const fields = v.trackingFields || v.tracking_fields || ['weight', 'reps'];
                const isOverridden = Boolean(v.isOverridden || (v.isPresetOverride && v.originalPresetName));
                const isCustom = Boolean(v.isCustom && !v.isPresetOverride);

                return (
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
                        <ClickableImage
                          src={v.image}
                          alt={v.name}
                          title={v.name}
                          subtitle={v.target}
                          className="w-12 h-12 rounded-xl shrink-0"
                          imgClassName="w-12 h-12 rounded-xl object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-dark-900 border border-white/5 flex items-center justify-center text-lime shrink-0">
                          <Dumbbell className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white group-hover:text-lime transition-colors truncate">
                            {v.name}
                          </h4>
                          {isOverridden && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Customized Preset
                            </span>
                          )}
                          {isCustom && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Custom
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 truncate">{v.target}</p>

                        {/* Units badge strip */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5 bg-white/5 px-1.5 py-0.5 rounded">
                            <Timer className="w-2.5 h-2.5 text-orange-400" />
                            <span>{v.defaultRestSec || 90}s</span>
                          </span>
                          {fields.map((f) => (
                            <span
                              key={f}
                              className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-lime/10 text-lime"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={(e) => handleEditMovement(e, v)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-lime transition-colors"
                        title="Edit Movement & Units"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {isCustom && v.id && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustom(e, v.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete from DB"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-lime" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Movement Editor Modal */}
      <MovementEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        movement={editingMovement}
        isLiveSession={true}
        onSaveMovement={handleMovementSaved}
        onResetPreset={loadCustomData}
      />

      {/* Master Movement Library Modal */}
      <MasterMovementLibraryModal
        isOpen={isMasterLibraryOpen}
        onClose={() => {
          setIsMasterLibraryOpen(false);
          loadCustomData();
        }}
        initialMuscle={selectedMuscle}
        onSelectMovement={(selected, muscle) => {
          onSelectVariation(selected, muscle);
          setIsMasterLibraryOpen(false);
          onClose();
        }}
      />
    </>
  );
};
