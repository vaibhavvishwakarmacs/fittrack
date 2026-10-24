import { api } from '../lib/api';
import { fastCache } from '../lib/cache';

const LOCAL_ACTIVITY_KEY = 'fittrack_user_activity_';

export const activityService = {
  async getActivityByDate(userId, date) {
    const cacheKey = `activity:${userId}:${date}`;
    const cached = fastCache.get(cacheKey);
    if (cached) {
      return { data: cached, error: null };
    }

    try {
      const data = await api.get(`/activity?date=${date}`);
      const result = data.data || null;
      fastCache.set(cacheKey, result, 30000);
      return { data: result, error: null };
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
    const cacheKey = `activity_range:${userId}:${startDate}:${endDate}`;
    const cached = fastCache.get(cacheKey);
    if (cached) {
      return { data: cached, error: null };
    }

    try {
      const data = await api.get(`/activity/range?startDate=${startDate}&endDate=${endDate}`);
      const list = data.data || [];
      fastCache.set(cacheKey, list, 30000);
      return { data: list, error: null };
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
    fastCache.invalidatePrefix(`activity:${userId}`);
    fastCache.invalidatePrefix(`activity_range:${userId}`);
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
      const list = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((a) => a.date === payload.date);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...record };
      } else {
        list.push(record);
      }
      localStorage.setItem(`${LOCAL_ACTIVITY_KEY}${userId}`, JSON.stringify(list));

      return { data: record, error: null };
    }
  },
};
