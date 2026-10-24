import { api } from '../lib/api';

const LOCAL_CUSTOM_EXERCISES_KEY = 'fittrack_custom_exercises';

export const exerciseService = {
  // Get all custom exercises for user
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

  // Save new custom exercise
  async createCustomExercise(payload) {
    try {
      const res = await api.post('/exercises/custom', payload);
      const created = res.data;

      // Update local storage cache
      try {
        const stored = localStorage.getItem(LOCAL_CUSTOM_EXERCISES_KEY);
        const list = stored ? JSON.parse(stored) : [];
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
        isCustom: true,
      };

      try {
        const stored = localStorage.getItem(LOCAL_CUSTOM_EXERCISES_KEY);
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(fallbackItem);
        localStorage.setItem(LOCAL_CUSTOM_EXERCISES_KEY, JSON.stringify(list));
      } catch {}

      return { data: fallbackItem, error: null };
    }
  },

  // Delete custom exercise
  async deleteCustomExercise(id) {
    try {
      await api.delete(`/exercises/custom/${id}`);
    } catch {}

    try {
      const stored = localStorage.getItem(LOCAL_CUSTOM_EXERCISES_KEY);
      if (stored) {
        const list = JSON.parse(stored);
        const filtered = list.filter((item) => item.id !== id);
        localStorage.setItem(LOCAL_CUSTOM_EXERCISES_KEY, JSON.stringify(filtered));
      }
    } catch {}

    return { success: true };
  },
};
