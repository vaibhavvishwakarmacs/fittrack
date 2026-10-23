import { api } from '../lib/api';

const LOCAL_NUTRITION_KEY = 'fittrack_user_nutrition_';
const LOCAL_WATER_KEY = 'fittrack_user_water_';

export const nutritionService = {
  async getNutritionLogs(userId, date) {
    try {
      const data = await api.get(`/nutrition?date=${date}`);
      return { data: data.data || [], error: null };
    } catch (err) {
      const stored = localStorage.getItem(`${LOCAL_NUTRITION_KEY}${userId}`);
      if (stored) {
        try {
          const list = JSON.parse(stored);
          return { data: list.filter((item) => item.date === date), error: null };
        } catch {}
      }
      return { data: [], error: null };
    }
  },

  async addFoodLog(userId, payload) {
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
      };
      const stored = localStorage.getItem(`${LOCAL_NUTRITION_KEY}${userId}`);
      const list = stored ? JSON.parse(stored) : [];
      list.push(localItem);
      localStorage.setItem(`${LOCAL_NUTRITION_KEY}${userId}`, JSON.stringify(list));
      return { data: localItem, error: null };
    }
  },

  async deleteFoodLog(userId, logId) {
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
    try {
      const data = await api.get(`/nutrition?date=${date}`);
      return { data: data.waterLogs || [], totalMl: data.totalWaterMl || 0, error: null };
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
