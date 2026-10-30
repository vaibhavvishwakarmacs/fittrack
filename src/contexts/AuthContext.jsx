import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { api, getAuthToken } from '../lib/api';

const LOCAL_USER_KEY = 'fittrack_cached_user';

const getCachedUser = () => {
  try {
    const s = localStorage.getItem(LOCAL_USER_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

const setCachedUser = (userData) => {
  try {
    if (userData) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  } catch {}
};

export const mapUserDataToProfile = (userData) => {
  if (!userData) return null;
  return {
    id: userData.id,
    email: userData.email,
    full_name: userData.fullName || userData.full_name,
    avatar_url: userData.avatarUrl || userData.avatar_url,
    fitness_goal: userData.fitnessGoal || userData.fitness_goal || 'build_muscle',
    activity_level: userData.activityLevel || userData.activity_level || 'moderate',
    gender: userData.gender || 'other',
    current_weight_kg: userData.currentWeightKg || userData.current_weight_kg || 75,
    target_weight_kg: userData.targetWeightKg || userData.target_weight_kg || 75,
    height_cm: userData.heightCm || userData.height_cm || 178,
    daily_calorie_target: userData.dailyCalorieTarget || userData.daily_calorie_target || 2200,
    daily_protein_target_g: userData.dailyProteinTargetG || userData.daily_protein_target_g || 140,
    daily_carbs_target_g: userData.dailyCarbsTargetG || userData.daily_carbs_target_g || 230,
    daily_fat_target_g: userData.dailyFatTargetG || userData.daily_fat_target_g || 65,
    daily_step_target: userData.dailyStepTarget || userData.daily_step_target || 10000,
    daily_water_target_ml: userData.dailyWaterTargetMl || userData.daily_water_target_ml || 2500,
    unit_system: userData.unitSystem || userData.unit_system || 'metric',
    onboarding_completed: userData.onboardingCompleted !== undefined ? userData.onboardingCompleted : (userData.onboarding_completed ?? false),
  };
};

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  // Synchronous rehydration: if token and cached user exist, 0ms boot time
  const [user, setUser] = useState(() => {
    const token = getAuthToken();
    const cached = getCachedUser();
    return token && cached ? cached : null;
  });

  const [profile, setProfile] = useState(() => {
    const token = getAuthToken();
    const cached = getCachedUser();
    return token && cached ? mapUserDataToProfile(cached) : null;
  });

  // If already authenticated via cache, loading is immediately false (0ms!)
  // If no token exists at all, loading is also false (redirect immediately)
  // Only true if token exists but no cached user profile in memory
  const [isLoading, setIsLoading] = useState(() => {
    const token = getAuthToken();
    const cached = getCachedUser();
    return Boolean(token && !cached);
  });

  const [isMongoConnected, setIsMongoConnected] = useState(true);

  // Sync profile from backend user object
  const syncUserState = useCallback((userData) => {
    if (!userData) {
      setUser(null);
      setProfile(null);
      setCachedUser(null);
      return;
    }

    setCachedUser(userData);
    setUser(userData);
    setProfile(mapUserDataToProfile(userData));
  }, []);

  // Background verification & health check (Stale-While-Revalidate)
  useEffect(() => {
    let isMounted = true;
    const token = getAuthToken();

    // 1. Silent, non-blocking health check
    api.checkHealth()
      .then((health) => {
        if (isMounted) setIsMongoConnected(Boolean(health.connected));
      })
      .catch(() => {
        if (isMounted) setIsMongoConnected(false);
      });

    // 2. If no token, we are definitively not authenticated
    if (!token) {
      if (isMounted) setIsLoading(false);
      return;
    }

    // 3. Revalidate current session in background
    authService.getMe()
      .then(({ user: currentUser, error }) => {
        if (!isMounted) return;
        if (currentUser) {
          syncUserState(currentUser);
        } else if (error && (error.status === 401 || error.status === 403)) {
          // Token expired or invalid
          authService.logout();
          syncUserState(null);
        }
      })
      .catch(() => {
        // Keep cached user if offline or network error
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [syncUserState]);

  const refreshProfile = useCallback(async () => {
    const { user: refreshed } = await authService.getMe();
    if (refreshed) {
      syncUserState(refreshed);
    }
  }, [syncUserState]);

  const updateProfile = useCallback(async (updates) => {
    const { data, error } = await profileService.updateProfile(updates);
    if (data) {
      syncUserState(data);
    }
    return { error };
  }, [syncUserState]);

  const signUp = async (email, password, fullName) => {
    const { user: createdUser, error } = await authService.register(email, password, fullName);
    if (!error && createdUser) {
      syncUserState(createdUser);
    }
    return { error };
  };

  const signIn = async (email, password) => {
    const { user: loggedInUser, error } = await authService.login(email, password);
    if (!error && loggedInUser) {
      syncUserState(loggedInUser);
    }
    return { error };
  };

  const signOut = async () => {
    authService.logout();
    syncUserState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isConfigured: isMongoConnected,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
