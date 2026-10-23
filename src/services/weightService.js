import { api } from '../lib/api';

const LOCAL_WEIGHT_KEY = 'fittrack_user_weight_';

export const weightService = {
  async getWeightLogs(userId) {
    try {
      const data = await api.get('/weight');
      return { data: data.data || [], error: null };
    } catch (err) {
      const stored = localStorage.getItem(`${LOCAL_WEIGHT_KEY}${userId}`);
      if (stored) {
        try {
          const list = JSON.parse(stored);
          return { data: list.sort((a, b) => a.date.localeCompare(b.date)), error: null };
        } catch {}
      }
      return { data: [], error: null };
    }
  },

  async addWeightLog(userId, payload) {
    try {
      const data = await api.post('/weight', payload);
      return { data: data.data, error: null };
    } catch (err) {
      const localItem = {
        id: `local-wt-${Date.now()}`,
        user_id: userId,
        date: payload.date,
        weight_kg: Number(payload.weightKg),
        body_fat_percentage: payload.bodyFatPercentage || null,
        notes: payload.notes || null,
        photo_url: payload.photoUrl || null,
      };
      const stored = localStorage.getItem(`${LOCAL_WEIGHT_KEY}${userId}`);
      const list = stored ? JSON.parse(stored) : [];
      list.push(localItem);
      localStorage.setItem(`${LOCAL_WEIGHT_KEY}${userId}`, JSON.stringify(list));
      return { data: localItem, error: null };
    }
  },

  async deleteWeightLog(userId, logId) {
    try {
      await api.delete(`/weight/${logId}`);
      return { success: true, error: null };
    } catch (err) {
      const stored = localStorage.getItem(`${LOCAL_WEIGHT_KEY}${userId}`);
      if (stored) {
        const list = JSON.parse(stored);
        const filtered = list.filter((w) => w.id !== logId);
        localStorage.setItem(`${LOCAL_WEIGHT_KEY}${userId}`, JSON.stringify(filtered));
      }
      return { success: true, error: null };
    }
  },
};
