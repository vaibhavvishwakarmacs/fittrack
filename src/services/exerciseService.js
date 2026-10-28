import { api } from '../lib/api.js';

const LOCAL_CUSTOM_EXERCISES_KEY = 'fittrack_custom_exercises';

export const TRACKING_FIELD_OPTIONS = [
  { id: 'weight', label: 'Weight', defaultUnit: 'kg/lbs', icon: 'Dumbbell' },
  { id: 'reps', label: 'Reps', defaultUnit: 'count', icon: 'RotateCw' },
  { id: 'time', label: 'Duration / Time', defaultUnit: 'seconds', icon: 'Timer' },
  { id: 'distance', label: 'Distance', defaultUnit: 'm / km', icon: 'Footprints' },
  { id: 'calories', label: 'Calories Burned', defaultUnit: 'kcal', icon: 'Flame' },
];

export const TRACKING_PRESETS = [
  { label: 'Standard Strength (Weight + Reps)', fields: ['weight', 'reps'] },
  { label: 'Bodyweight (Reps Only)', fields: ['reps'] },
  { label: 'Isometric Hold (Time Only)', fields: ['time'] },
  { label: 'Weighted Hold (Weight + Time)', fields: ['weight', 'time'] },
  { label: 'Cardio Run / Row (Distance + Time)', fields: ['distance', 'time'] },
  { label: 'Cardio Erg / Bike (Time + Calories)', fields: ['time', 'calories'] },
  { label: 'Full Hybrid (All Units)', fields: ['weight', 'reps', 'time', 'distance', 'calories'] },
];

export const formatDuration = (totalSec) => {
  const secs = Number(totalSec) || 0;
  if (secs <= 0) return '0s';
  const mins = Math.floor(secs / 60);
  const remSec = secs % 60;
  if (mins > 0 && remSec > 0) return `${mins}m ${remSec}s`;
  if (mins > 0) return `${mins}m`;
  return `${remSec}s`;
};

export const formatDistance = (meters) => {
  const m = Number(meters) || 0;
  if (m <= 0) return '0m';
  if (m >= 1000) {
    const km = (m / 1000).toFixed(m % 1000 === 0 ? 0 : 2);
    return `${km}km`;
  }
  return `${m}m`;
};

export const formatSetDisplay = (set, trackingFields = null, unit = 'kg') => {
  if (!set) return '';

  const fields = Array.isArray(trackingFields) && trackingFields.length > 0
    ? trackingFields
    : (set.trackingFields || set.tracking_fields || ['weight', 'reps']);

  const weight = set.weight_kg !== undefined ? Number(set.weight_kg) : set.weightKg !== undefined ? Number(set.weightKg) : 0;
  const reps = set.reps !== undefined ? Number(set.reps) : 0;
  const timeSec = set.time_sec !== undefined ? Number(set.time_sec) : set.timeSec !== undefined ? Number(set.timeSec) : 0;
  const distanceMeters = set.distance_meters !== undefined ? Number(set.distance_meters) : set.distanceMeters !== undefined ? Number(set.distanceMeters) : 0;
  const calories = Number(set.calories) || 0;

  const parts = [];

  // Weight & Reps standard
  if (fields.includes('weight') && fields.includes('reps')) {
    parts.push(`${weight}${unit} × ${reps}`);
  } else {
    if (fields.includes('weight') && weight > 0) parts.push(`${weight}${unit}`);
    if (fields.includes('reps') && reps > 0) parts.push(`${reps} reps`);
  }

  // Time
  if (fields.includes('time') && timeSec > 0) {
    parts.push(formatDuration(timeSec));
  }

  // Distance
  if (fields.includes('distance') && distanceMeters > 0) {
    parts.push(formatDistance(distanceMeters));
  }

  // Calories
  if (fields.includes('calories') && calories > 0) {
    parts.push(`${calories} kcal`);
  }

  // Fallback for legacy sets with no explicit trackingFields
  if (parts.length === 0) {
    if (weight > 0 && reps > 0) return `${weight}${unit} × ${reps}`;
    if (reps > 0) return `${reps} reps`;
    if (timeSec > 0) return formatDuration(timeSec);
    if (distanceMeters > 0) return formatDistance(distanceMeters);
    if (calories > 0) return `${calories} kcal`;
    return `${weight || 0}${unit} × ${reps || 0}`;
  }

  let text = parts.join(' • ');
  if (set.rpe) text += ` @RPE${set.rpe}`;
  return text;
};

export const exerciseService = {
  // Get all custom exercises & overrides for user
  async getCustomExercises() {
    try {
      const res = await api.get('/exercises/custom');
      const serverList = res.data || [];
      // Cache to local storage
      localStorage.setItem(LOCAL_CUSTOM_EXERCISES_KEY, JSON.stringify(serverList));
      return { data: serverList, error: null };
    } catch {
      // Local fallback
      try {
        const stored = localStorage.getItem(LOCAL_CUSTOM_EXERCISES_KEY);
        return { data: stored ? JSON.parse(stored) : [], error: null };
      } catch {
        return { data: [], error: null };
      }
    }
  },

  // Save new custom exercise or preset override
  async createCustomExercise(payload) {
    try {
      const res = await api.post('/exercises/custom', payload);
      const created = res.data;

      // Update local storage cache
      try {
        const stored = localStorage.getItem(LOCAL_CUSTOM_EXERCISES_KEY);
        let list = stored ? JSON.parse(stored) : [];
        if (created.isPresetOverride && created.originalPresetName) {
          list = list.filter((i) => i.originalPresetName !== created.originalPresetName);
        }
        list.unshift(created);
        localStorage.setItem(LOCAL_CUSTOM_EXERCISES_KEY, JSON.stringify(list));
      } catch {}

      return { data: created, error: null };
    } catch (err) {
      // Offline / Local sandbox fallback
      const fallbackItem = {
        id: `local-custom-${Date.now()}`,
        name: payload.name,
        muscle: payload.muscle,
        target: payload.target,
        tips: payload.tips || [],
        image: payload.image || null,
        defaultRestSec: payload.defaultRestSec || 90,
        trackingFields: payload.trackingFields || ['weight', 'reps'],
        isCustom: !payload.isPresetOverride,
        isPresetOverride: Boolean(payload.isPresetOverride),
        originalPresetName: payload.originalPresetName || null,
      };

      try {
        const stored = localStorage.getItem(LOCAL_CUSTOM_EXERCISES_KEY);
        let list = stored ? JSON.parse(stored) : [];
        if (fallbackItem.isPresetOverride && fallbackItem.originalPresetName) {
          list = list.filter((i) => i.originalPresetName !== fallbackItem.originalPresetName);
        }
        list.unshift(fallbackItem);
        localStorage.setItem(LOCAL_CUSTOM_EXERCISES_KEY, JSON.stringify(list));
      } catch {}

      return { data: fallbackItem, error: null };
    }
  },

  // Update existing custom exercise or preset override
  async updateCustomExercise(id, payload) {
    try {
      const res = await api.put(`/exercises/custom/${id}`, payload);
      const updated = res.data;

      try {
        const stored = localStorage.getItem(LOCAL_CUSTOM_EXERCISES_KEY);
        if (stored) {
          const list = JSON.parse(stored).map((item) => (item.id === id ? { ...item, ...updated } : item));
          localStorage.setItem(LOCAL_CUSTOM_EXERCISES_KEY, JSON.stringify(list));
        }
      } catch {}

      return { data: updated, error: null };
    } catch (err) {
      // Offline fallback
      try {
        const stored = localStorage.getItem(LOCAL_CUSTOM_EXERCISES_KEY);
        if (stored) {
          const list = JSON.parse(stored).map((item) => (item.id === id ? { ...item, ...payload } : item));
          localStorage.setItem(LOCAL_CUSTOM_EXERCISES_KEY, JSON.stringify(list));
        }
      } catch {}

      return { data: { id, ...payload }, error: null };
    }
  },

  // Reset preset back to factory default
  async resetPreset(presetName) {
    try {
      await api.post('/exercises/reset-preset', { presetName });
    } catch {}

    try {
      const stored = localStorage.getItem(LOCAL_CUSTOM_EXERCISES_KEY);
      if (stored) {
        const list = JSON.parse(stored).filter((item) => item.originalPresetName !== presetName);
        localStorage.setItem(LOCAL_CUSTOM_EXERCISES_KEY, JSON.stringify(list));
      }
    } catch {}

    return { success: true };
  },

  // Delete custom exercise
  async deleteCustomExercise(id) {
    try {
      await api.delete(`/exercises/custom/${id}`);
    } catch {}

    try {
      const stored = localStorage.getItem(LOCAL_CUSTOM_EXERCISES_KEY);
      if (stored) {
        const list = JSON.parse(stored).filter((item) => item.id !== id);
        localStorage.setItem(LOCAL_CUSTOM_EXERCISES_KEY, JSON.stringify(list));
      }
    } catch {}

    return { success: true };
  },

  // Helper to merge preset variations by muscle with user DB custom exercises and preset overrides
  mergeMovementsWithOverrides(presetVariationsByMuscle, dbCustomList = []) {
    const result = {};

    Object.keys(presetVariationsByMuscle).forEach((muscleKey) => {
      const presets = presetVariationsByMuscle[muscleKey] || [];
      const muscleLower = muscleKey.toLowerCase();

      // Find user overrides for presets in this muscle group
      const mergedPresets = presets.map((preset) => {
        const override = dbCustomList.find(
          (c) => c.isPresetOverride && (c.originalPresetName === preset.name || c.name === preset.name)
        );

        if (override) {
          return {
            ...preset,
            ...override,
            id: override.id,
            isOverridden: true,
            originalPresetName: preset.name,
            trackingFields: override.trackingFields || preset.trackingFields || ['weight', 'reps'],
          };
        }

        return {
          ...preset,
          trackingFields: preset.trackingFields || ['weight', 'reps'],
          isPreset: true,
          isOverridden: false,
        };
      });

      // Find user-created custom movements for this muscle (not preset overrides)
      const purelyCustom = dbCustomList.filter(
        (c) => (c.muscle || '').toLowerCase() === muscleLower && !c.isPresetOverride
      );

      result[muscleKey] = [...mergedPresets, ...purelyCustom];
    });

    return result;
  },
};
