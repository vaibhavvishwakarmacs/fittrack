import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { ClickableImage } from '../common/ImageViewerModal';
import { MovementEditorModal } from './MovementEditorModal';
import { MUSCLE_GROUPS, EXERCISE_VARIATIONS_BY_MUSCLE } from '../../data/muscleData';
import { exerciseService, TRACKING_FIELD_OPTIONS } from '../../services/exerciseService';
import { useToast } from '../../contexts/ToastContext';
import {
  Layers,
  Search,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Timer,
  Dumbbell,
  Sparkles,
  Filter,
  Check,
  Flame,
  Footprints,
  RotateCw,
} from 'lucide-react';

export const MasterMovementLibraryModal = ({
  isOpen,
  onClose,
  initialMuscle = 'all',
  onSelectMovement = null, // If passed, allows picking a movement into session
}) => {
  const { success, error: toastError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState(initialMuscle);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('all');

  const [dbCustomExercises, setDbCustomExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Movement Editor Modal state
  const [editingMovement, setEditingMovement] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Delete modal state
  const [movementToDelete, setMovementToDelete] = useState(null);

  const loadMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await exerciseService.getCustomExercises();
      if (res?.data) {
        setDbCustomExercises(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadMovements();
    }
  }, [isOpen, loadMovements]);

  // Combine default preset variations with user's DB overrides & custom exercises
  const allMovements = useMemo(() => {
    const mergedByMuscle = exerciseService.mergeMovementsWithOverrides(
      EXERCISE_VARIATIONS_BY_MUSCLE,
      dbCustomExercises
    );

    const flatList = [];
    Object.keys(mergedByMuscle).forEach((mKey) => {
      (mergedByMuscle[mKey] || []).forEach((m) => {
        flatList.push({
          ...m,
          muscle: m.muscle || mKey,
        });
      });
    });

    return flatList;
  }, [dbCustomExercises]);

  // Filtering
  const filteredMovements = useMemo(() => {
    return allMovements.filter((m) => {
      // Muscle filter
      if (selectedMuscle !== 'all' && (m.muscle || '').toLowerCase() !== selectedMuscle.toLowerCase()) {
        return false;
      }

      // Unit filter
      const fields = m.trackingFields || m.tracking_fields || ['weight', 'reps'];
      if (selectedUnitFilter !== 'all' && !fields.includes(selectedUnitFilter)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (m.name || '').toLowerCase().includes(q);
        const matchTarget = (m.target || '').toLowerCase().includes(q);
        const matchTips = Array.isArray(m.tips) && m.tips.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchTarget && !matchTips) return false;
      }

      return true;
    });
  }, [allMovements, selectedMuscle, selectedUnitFilter, searchQuery]);

  // Handle open editor for new movement
  const handleCreateNew = () => {
    setEditingMovement({
      name: '',
      muscle: selectedMuscle !== 'all' ? selectedMuscle : 'chest',
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

  // Handle open editor for existing movement
  const handleEditMovement = (mov) => {
    setEditingMovement(mov);
    setIsEditorOpen(true);
  };

  // Handle save from editor
  const handleMovementSaved = () => {
    loadMovements();
  };

  // Handle reset preset
  const handleResetPreset = async (presetName) => {
    try {
      await exerciseService.resetPreset(presetName);
      success(`Reset "${presetName}" to factory defaults.`);
      loadMovements();
    } catch {
      toastError(`Failed to reset "${presetName}".`);
    }
  };

  // Handle delete custom
  const handleConfirmDelete = async () => {
    if (!movementToDelete) return;
    try {
      await exerciseService.deleteCustomExercise(movementToDelete.id);
      success(`Deleted "${movementToDelete.name}"`);
      setMovementToDelete(null);
      loadMovements();
    } catch {
      toastError('Failed to delete movement.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Master Movement Library"
      description="Manage, customize, and configure all workout movements and tracking units"
      maxWidth="2xl"
    >
      <div className="space-y-4 text-left">
        {/* Top Controls: Search & New Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search movements, muscles, or cues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0d14] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleCreateNew}
            leftIcon={<Plus className="w-4 h-4" />}
            className="font-bold shadow-lime-sm justify-center shrink-0"
          >
            + Create Movement
          </Button>
        </div>

        {/* Muscle Filter Tabs */}
        <div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedMuscle('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedMuscle === 'all'
                  ? 'bg-lime text-dark-950 font-black border-lime shadow-lime-sm'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 border-white/10'
              }`}
            >
              All Muscles ({allMovements.length})
            </button>
            {MUSCLE_GROUPS.map((m) => {
              const count = allMovements.filter(
                (mov) => (mov.muscle || '').toLowerCase() === m.id.toLowerCase()
              ).length;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMuscle(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedMuscle === m.id
                      ? 'bg-lime text-dark-950 font-black border-lime shadow-lime-sm'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 border-white/10'
                  }`}
                >
                  {m.label.split(' ')[0]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Tracking Units Quick Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
          <span className="text-slate-400 font-bold uppercase text-[9px] shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-lime" />
            <span>Unit:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedUnitFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all border ${
              selectedUnitFilter === 'all'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-transparent text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            All Units
          </button>

          {TRACKING_FIELD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedUnitFilter(opt.id)}
              className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all flex items-center gap-1 border ${
                selectedUnitFilter === opt.id
                  ? 'bg-lime/20 text-lime border-lime/40'
                  : 'bg-transparent text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              {opt.id === 'weight' && <Dumbbell className="w-3 h-3 text-lime" />}
              {opt.id === 'reps' && <RotateCw className="w-3 h-3 text-sky-400" />}
              {opt.id === 'time' && <Timer className="w-3 h-3 text-amber-400" />}
              {opt.id === 'distance' && <Footprints className="w-3 h-3 text-emerald-400" />}
              {opt.id === 'calories' && <Flame className="w-3 h-3 text-orange-400" />}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Movements List */}
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto no-scrollbar pr-1">
          {filteredMovements.length > 0 ? (
            filteredMovements.map((m, idx) => {
              const fields = m.trackingFields || m.tracking_fields || ['weight', 'reps'];
              const isOverridden = Boolean(m.isOverridden || (m.isPresetOverride && m.originalPresetName));
              const isCustom = Boolean(m.isCustom && !m.isPresetOverride);

              return (
                <div
                  key={m.id || idx}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-lime/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {m.image ? (
                      <ClickableImage
                        src={m.image}
                        alt={m.name}
                        title={m.name}
                        subtitle={m.target}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl shrink-0"
                        imgClassName="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-dark-900 border border-white/10 flex items-center justify-center text-lime shrink-0">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white group-hover:text-lime transition-colors">
                          {m.name}
                        </h4>

                        <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                          {m.muscle}
                        </span>

                        {isOverridden && (
                          <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Customized Preset
                          </span>
                        )}

                        {isCustom && (
                          <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Custom Movement
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 truncate">{m.target}</p>

                      {/* Units & Rest Timer Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md">
                          <Timer className="w-3 h-3 text-orange-400" />
                          <span>{m.defaultRestSec || 90}s rest</span>
                        </span>

                        {fields.map((f) => (
                          <span
                            key={f}
                            className="text-[9px] uppercase font-black px-2 py-0.5 rounded-md bg-lime/10 text-lime border border-lime/20"
                          >
                            {f}
                          </span>
                        ))}
                      </div>

                      {/* Form Tips snippet */}
                      {m.tips?.[0] && (
                        <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">
                          "{m.tips[0]}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {onSelectMovement && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          onSelectMovement(m, m.muscle);
                          onClose();
                        }}
                        className="text-xs font-bold px-3 py-1.5"
                      >
                        Select
                      </Button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleEditMovement(m)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-lime border border-white/10 transition-colors"
                      title="Edit Movement & Units"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {isOverridden && (
                      <button
                        type="button"
                        onClick={() => handleResetPreset(m.originalPresetName || m.name)}
                        className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 transition-colors"
                        title="Reset Preset to Factory Defaults"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isCustom && m.id && (
                      <button
                        type="button"
                        onClick={() => setMovementToDelete(m)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition-colors"
                        title="Delete Custom Movement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs rounded-2xl bg-white/[0.02] border border-white/5">
              No movements match your filters. Try clearing the search or create a new movement!
            </div>
          )}
        </div>
      </div>

      {/* Movement Editor Modal */}
      <MovementEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        movement={editingMovement}
        isLiveSession={false}
        onSaveMovement={handleMovementSaved}
        onResetPreset={handleResetPreset}
      />

      {/* Confirm Delete Custom Movement Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(movementToDelete)}
        onClose={() => setMovementToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Custom Movement"
        itemName={movementToDelete?.name}
        message={`Are you sure you want to delete "${movementToDelete?.name}" from your Master Movement Library?`}
      />
    </Modal>
  );
};
