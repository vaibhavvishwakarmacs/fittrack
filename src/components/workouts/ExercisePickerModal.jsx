import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { DEFAULT_EXERCISES } from '../../data/exerciseLibrary';
import { Search, Plus, Dumbbell } from 'lucide-react';

export const ExercisePickerModal = ({
  isOpen,
  onClose,
  onSelectExercise,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customName, setCustomName] = useState('');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'chest', label: 'Chest' },
    { id: 'back', label: 'Back' },
    { id: 'legs', label: 'Legs' },
    { id: 'shoulders', label: 'Shoulders' },
    { id: 'arms', label: 'Arms' },
    { id: 'core', label: 'Core' },
    { id: 'cardio', label: 'Cardio' },
  ];

  const filteredExercises = DEFAULT_EXERCISES.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.primaryMuscle.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (name, category) => {
    onSelectExercise(name, category);
    onClose();
    setSearch('');
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    const cat = selectedCategory === 'all' ? 'other' : selectedCategory;
    onSelectExercise(customName.trim(), cat);
    setCustomName('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Exercise"
      description="Choose from exercise library or add a custom movement"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search exercises by name or muscle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-lime"
          />
        </div>

        {/* Category horizontal chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-lime text-dark-950 font-bold'
                  : 'bg-dark-850 text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Custom exercise quick entry */}
        <div className="p-3 rounded-xl bg-dark-950 border border-white/10 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type custom exercise name..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            disabled={!customName.trim()}
            className="px-3 py-1.5 bg-lime/20 hover:bg-lime text-lime hover:text-dark-950 font-bold rounded-lg text-xs transition-colors disabled:opacity-40"
          >
            Add Custom
          </button>
        </div>

        {/* Exercise List */}
        <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar pr-1">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No matching library exercises. Use the custom exercise box above.
            </div>
          ) : (
            filteredExercises.map((ex) => (
              <div
                key={ex.id}
                onClick={() => handleSelect(ex.name, ex.category)}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-850/80 hover:bg-dark-800 border border-white/5 hover:border-lime/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-lime group-hover:bg-lime/10 transition-colors">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-white truncate group-hover:text-lime transition-colors">
                      {ex.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {ex.primaryMuscle} • <span className="capitalize">{ex.equipment}</span>
                    </p>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-lime shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
