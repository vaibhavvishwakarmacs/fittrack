import { api } from '../lib/api';
import { fastCache } from '../lib/cache';

const LOCAL_NUTRITION_KEY = 'fittrack_user_nutrition_';
const LOCAL_WATER_KEY = 'fittrack_user_water_';

export const nutritionService = {
  async getNutritionLogs(userId, date) {
    const cacheKey = `nutrition:${userId}:${date}`;
    const cached = fastCache.get(cacheKey);
    if (cached) {
      return { data: cached, error: null };
    }

    try {
      const data = await api.get(`/nutrition?date=${date}`);
      const logs = data.data || [];
      fastCache.set(cacheKey, logs, 30000);
      return { data: logs, error: null };
    } catch (err) {
      const stored = localStorage.getItem(`${LOCAL_NUTRITION_KEY}${userId}`);
      if (stored) {
        try {
          const list = JSON.parse(stored);
          const filtered = list.filter((item) => item.date === date);
          return { data: filtered, error: null };
        } catch {}
      }
      return { data: [], error: null };
    }
  },

  async addFoodLog(userId, payload) {
    fastCache.invalidatePrefix(`nutrition:${userId}`);
    try {
      const data = await api.post('/nutrition/food', payload);
      return { data: data.data, error: null };
    } catch (err) {
      const localItem = {
        id: `local-food-${Date.now()}`,
        user_id: userId,
        date: payload.date,
        meal_type: payload.mealType,
        food_name: payload.foodName,
        serving_size: payload.servingSize || '1 serving',
        calories: Number(payload.calories) || 0,
        protein_g: Number(payload.proteinG) || 0,
        carbs_g: Number(payload.carbsG) || 0,
        fat_g: Number(payload.fatG) || 0,
        photo_url: payload.photoUrl || payload.photo_url || null,
      };
      const stored = localStorage.getItem(`${LOCAL_NUTRITION_KEY}${userId}`);
      const list = stored ? JSON.parse(stored) : [];
      list.push(localItem);
      localStorage.setItem(`${LOCAL_NUTRITION_KEY}${userId}`, JSON.stringify(list));
      return { data: localItem, error: null };
    }
  },

  async updateFoodLog(userId, logId, payload) {
    fastCache.invalidatePrefix(`nutrition:${userId}`);
    try {
      const data = await api.put(`/nutrition/food/${logId}`, payload);
      return { data: data.data, error: null };
    } catch (err) {
      const stored = localStorage.getItem(`${LOCAL_NUTRITION_KEY}${userId}`);
      if (stored) {
        try {
          const list = JSON.parse(stored);
          const idx = list.findIndex((item) => item.id === logId);
          if (idx !== -1) {
            list[idx] = {
              ...list[idx],
              date: payload.date || list[idx].date,
              meal_type: payload.mealType || list[idx].meal_type,
              food_name: payload.foodName || list[idx].food_name,
              serving_size: payload.servingSize !== undefined ? payload.servingSize : list[idx].serving_size,
              calories: payload.calories !== undefined ? Number(payload.calories) : list[idx].calories,
              protein_g: payload.proteinG !== undefined ? Number(payload.proteinG) : list[idx].protein_g,
              carbs_g: payload.carbsG !== undefined ? Number(payload.carbsG) : list[idx].carbs_g,
              fat_g: payload.fatG !== undefined ? Number(payload.fatG) : list[idx].fat_g,
              photo_url: payload.photoUrl !== undefined ? payload.photoUrl : list[idx].photo_url,
            };
            localStorage.setItem(`${LOCAL_NUTRITION_KEY}${userId}`, JSON.stringify(list));
            return { data: list[idx], error: null };
          }
        } catch {}
      }
      return { data: null, error: err };
    }
  },

  async deleteFoodLog(userId, logId) {
    fastCache.invalidatePrefix(`nutrition:${userId}`);
    try {
      await api.delete(`/nutrition/food/${logId}`);
      return { success: true, error: null };
    } catch (err) {
      const stored = localStorage.getItem(`${LOCAL_NUTRITION_KEY}${userId}`);
      if (stored) {
        const list = JSON.parse(stored);
        const filtered = list.filter((item) => item.id !== logId);
        localStorage.setItem(`${LOCAL_NUTRITION_KEY}${userId}`, JSON.stringify(filtered));
      }
      return { success: true, error: null };
    }
  },

  async getWaterLogs(userId, date) {
    const cacheKey = `water:${userId}:${date}`;
    const cached = fastCache.get(cacheKey);
    if (cached) {
      return { data: cached.data, totalMl: cached.totalMl, error: null };
    }

    try {
      const data = await api.get(`/nutrition?date=${date}`);
      const res = { data: data.waterLogs || [], totalMl: data.totalWaterMl || 0 };
      fastCache.set(cacheKey, res, 30000);
      return { data: res.data, totalMl: res.totalMl, error: null };
    } catch (err) {
      const stored = localStorage.getItem(`${LOCAL_WATER_KEY}${userId}`);
      if (stored) {
        try {
          const list = JSON.parse(stored);
          const dayLogs = list.filter((w) => w.date === date);
          const totalMl = dayLogs.reduce((acc, curr) => acc + (curr.amount_ml || curr.amountMl || 0), 0);
          return { data: dayLogs, totalMl, error: null };
        } catch {}
      }
      return { data: [], totalMl: 0, error: null };
    }
  },

  async logWater(userId, date, amountMl) {
    fastCache.invalidatePrefix(`water:${userId}`);
    try {
      const data = await api.post('/nutrition/water', { date, amountMl });
      return { data: data.data, error: null };
    } catch (err) {
      const localWater = {
        id: `local-water-${Date.now()}`,
        user_id: userId,
        date,
        amount_ml: amountMl,
      };
      const stored = localStorage.getItem(`${LOCAL_WATER_KEY}${userId}`);
      const list = stored ? JSON.parse(stored) : [];
      list.push(localWater);
      localStorage.setItem(`${LOCAL_WATER_KEY}${userId}`, JSON.stringify(list));
      return { data: localWater, error: null };
    }
  },
};
