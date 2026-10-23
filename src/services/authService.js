import { api, setAuthToken } from '../lib/api';

const LOCAL_USER_KEY = 'fittrack_local_active_user';

export const authService = {
  async register(email, password, fullName) {
    try {
      const data = await api.post('/auth/register', { email, password, fullName });
      if (data.token) {
        setAuthToken(data.token);
      }
      return { user: data.user, error: null };
    } catch (err) {
      // Offline fallback if backend isn't reachable
      if (err.message && err.message.includes('fetch')) {
        const localUser = {
          id: `local_${Date.now()}`,
          email,
          fullName,
          onboardingCompleted: false,
          dailyCalorieTarget: 2200,
          dailyProteinTargetG: 140,
          dailyCarbsTargetG: 230,
          dailyFatTargetG: 65,
          dailyStepTarget: 10000,
          dailyWaterTargetMl: 2500,
          unitSystem: 'metric',
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
        return { user: localUser, error: null };
      }
      return { user: null, error: err };
    }
  },

  async login(email, password) {
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.token) {
        setAuthToken(data.token);
      }
      return { user: data.user, error: null };
    } catch (err) {
      // Offline fallback if backend is offline
      if (err.message && (err.message.includes('fetch') || err.message.includes('Failed to fetch'))) {
        const localUser = {
          id: `local_${btoa(email).substring(0, 8)}`,
          email,
          fullName: email.split('@')[0],
          onboardingCompleted: false,
          dailyCalorieTarget: 2200,
          dailyProteinTargetG: 140,
          dailyCarbsTargetG: 230,
          dailyFatTargetG: 65,
          dailyStepTarget: 10000,
          dailyWaterTargetMl: 2500,
          unitSystem: 'metric',
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
        return { user: localUser, error: null };
      }
      return { user: null, error: err };
    }
  },

  async getMe() {
    try {
      const data = await api.get('/auth/me');
      return { user: data.user, error: null };
    } catch (err) {
      const local = localStorage.getItem(LOCAL_USER_KEY);
      if (local) {
        try {
          return { user: JSON.parse(local), error: null };
        } catch {}
      }
      return { user: null, error: err };
    }
  },

  logout() {
    setAuthToken(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  },
};
