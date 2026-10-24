import { api } from '../lib/api';
import { fastCache } from '../lib/cache';

const LOCAL_WORKOUTS_KEY = 'fittrack_user_workouts_';

export const workoutService = {
  async getWorkouts(userId) {
    const cacheKey = `workouts:${userId}`;
    const cached = fastCache.get(cacheKey);
    if (cached) {
      return { data: cached, error: null };
    }

    try {
      const data = await api.get('/workouts');
      const list = data.data || [];
      fastCache.set(cacheKey, list, 30000);
      return { data: list, error: null };
    } catch (err) {
      const stored = localStorage.getItem(`${LOCAL_WORKOUTS_KEY}${userId}`);
      if (stored) {
        try {
          return { data: JSON.parse(stored), error: null };
        } catch {}
      }
      return { data: [], error: null };
    }
  },

  async createWorkout(userId, payload) {
    fastCache.invalidatePrefix(`workouts:${userId}`);
    try {
      const data = await api.post('/workouts', payload);
      return { data: data.data, error: null };
    } catch (err) {
      // Local fallback
      let totalVolume = 0;
      (payload.exercises || []).forEach((ex) => {
        (ex.sets || []).forEach((s) => {
          if (s.isCompleted !== false) {
            totalVolume += (Number(s.reps) || 0) * (Number(s.weightKg) || 0);
          }
        });
      });

      const newWorkout = {
        id: `local-wo-${Date.now()}`,
        user_id: userId,
        title: payload.title,
        category: payload.category || 'strength',
        duration_minutes: payload.durationMinutes || 45,
        total_volume_kg: totalVolume,
        calories_burned: Math.round((payload.durationMinutes || 45) * 6.5),
        notes: payload.notes || null,
        started_at: payload.startedAt || new Date().toISOString(),
        exercises: (payload.exercises || []).map((ex, exIdx) => ({
          id: `local-ex-${Date.now()}-${exIdx}`,
          exercise_name: ex.name,
          exercise_category: ex.category || 'chest',
          order_index: exIdx,
          notes: ex.notes || null,
          sets: (ex.sets || []).map((s, sIdx) => ({
            id: `local-set-${Date.now()}-${exIdx}-${sIdx}`,
            set_number: s.setNumber,
            reps: Number(s.reps) || 0,
            weight_kg: Number(s.weightKg) || 0,
            rpe: s.rpe || null,
            is_completed: s.isCompleted !== false,
          })),
        })),
      };

      const stored = localStorage.getItem(`${LOCAL_WORKOUTS_KEY}${userId}`);
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newWorkout);
      localStorage.setItem(`${LOCAL_WORKOUTS_KEY}${userId}`, JSON.stringify(list));

      return { data: newWorkout, error: null };
    }
  },

  async updateWorkout(userId, workoutId, payload) {
    fastCache.invalidatePrefix(`workouts:${userId}`);
    try {
      const data = await api.put(`/workouts/${workoutId}`, payload);
      return { data: data.data, error: null };
    } catch (err) {
      const stored = localStorage.getItem(`${LOCAL_WORKOUTS_KEY}${userId}`);
      if (stored) {
        try {
          const list = JSON.parse(stored);
          const idx = list.findIndex((w) => w.id === workoutId);
          if (idx !== -1) {
            list[idx] = {
              ...list[idx],
              title: payload.title || list[idx].title,
              category: payload.category || list[idx].category,
              notes: payload.notes !== undefined ? payload.notes : list[idx].notes,
              duration_minutes: payload.durationMinutes ? Number(payload.durationMinutes) : list[idx].duration_minutes,
            };
            localStorage.setItem(`${LOCAL_WORKOUTS_KEY}${userId}`, JSON.stringify(list));
            return { data: list[idx], error: null };
          }
        } catch {}
      }
      return { data: null, error: err };
    }
  },

  async deleteWorkout(userId, workoutId) {
    fastCache.invalidatePrefix(`workouts:${userId}`);
    try {
      await api.delete(`/workouts/${workoutId}`);
      return { success: true, error: null };
    } catch (err) {
      const stored = localStorage.getItem(`${LOCAL_WORKOUTS_KEY}${userId}`);
      if (stored) {
        const list = JSON.parse(stored);
        const filtered = list.filter((w) => w.id !== workoutId);
        localStorage.setItem(`${LOCAL_WORKOUTS_KEY}${userId}`, JSON.stringify(filtered));
      }
      return { success: true, error: null };
    }
  },
};
