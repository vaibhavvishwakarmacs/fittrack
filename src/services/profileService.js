import { api } from '../lib/api';

const LOCAL_USER_KEY = 'fittrack_local_active_user';

export const profileService = {
  async getProfile(userId) {
    try {
      const data = await api.get('/auth/me');
      return { data: data.user, error: null };
    } catch (err) {
      const local = localStorage.getItem(LOCAL_USER_KEY);
      if (local) {
        try {
          return { data: JSON.parse(local), error: null };
        } catch {}
      }
      return { data: null, error: err };
    }
  },

  async updateProfile(updates) {
    try {
      const data = await api.put('/profile', updates);
      return { data: data.user, error: null };
    } catch (err) {
      // Local fallback
      const local = localStorage.getItem(LOCAL_USER_KEY);
      const parsed = local ? JSON.parse(local) : {};
      const merged = { ...parsed, ...updates };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(merged));
      return { data: merged, error: null };
    }
  },

  async upsertProfile(profile) {
    return this.updateProfile(profile);
  },
};
