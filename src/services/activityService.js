import { api } from '../lib/api';

const LOCAL_ACTIVITY_KEY = 'fittrack_user_activity_';

export const activityService = {
  async getActivityByDate(userId, date) {
    try {
      const data = await api.get(`/activity?date=${date}`);
      return { data: data.data || null, error: null };
    } catch (err) {
      const stored = localStorage.getItem(`${LOCAL_ACTIVITY_KEY}${userId}`);
      if (stored) {
        try {
          const list = JSON.parse(stored);
          const found = list.find((a) => a.date === date) || null;
          return { data: found, error: null };
        } catch {}
      }
      return { data: null, error: null };
    }
  },

  async getActivityRange(userId, startDate, endDate) {
    try {
      const data = await api.get(`/activity/range?startDate=${startDate}&endDate=${endDate}`);
      return { data: data.data || [], error: null };
    } catch (err) {
      const stored = localStorage.getItem(`${LOCAL_ACTIVITY_KEY}${userId}`);
      if (stored) {
        try {
          const list = JSON.parse(stored);
          const filtered = list.filter((a) => a.date >= startDate && a.date <= endDate);
          return { data: filtered.sort((a, b) => a.date.localeCompare(b.date)), error: null };
        } catch {}
      }
      return { data: [], error: null };
    }
  },

  async upsertActivity(userId, payload) {
    try {
      const data = await api.post('/activity', payload);
      return { data: data.data, error: null };
    } catch (err) {
      const s = Number(payload.steps) || 0;
      const distanceKm = payload.distanceKm !== undefined ? payload.distanceKm : Math.round(s * 0.00075 * 100) / 100;
      const activeCalories = payload.activeCalories !== undefined ? payload.activeCalories : Math.round(s * 0.04);
      const durationMinutes = payload.durationMinutes !== undefined ? payload.durationMinutes : Math.round(s / 100);

      const record = {
        id: `local-act-${Date.now()}`,
        user_id: userId,
        date: payload.date,
        steps: s,
        distance_km: distanceKm,
        active_calories: activeCalories,
        duration_minutes: durationMinutes,
        notes: payload.notes || null,
      };

      const stored = localStorage.getItem(`${LOCAL_ACTIVITY_KEY}${userId}`);
      let list = stored ? JSON.parse(stored) : [];
      const existingIdx = list.findIndex((a) => a.date === payload.date);

      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...record };
      } else {
        list.push(record);
      }

      localStorage.setItem(`${LOCAL_ACTIVITY_KEY}${userId}`, JSON.stringify(list));
      return { data: record, error: null };
    }
  },
};
