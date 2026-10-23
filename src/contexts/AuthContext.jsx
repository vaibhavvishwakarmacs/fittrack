import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { api } from '../lib/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMongoConnected, setIsMongoConnected] = useState(false);

  // Sync profile from backend user object
  const syncUserState = useCallback((userData) => {
    if (!userData) {
      setUser(null);
      setProfile(null);
      return;
    }

    setUser(userData);
    setProfile({
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
    });
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // Check MongoDB health
      const health = await api.checkHealth();
      if (isMounted) {
        setIsMongoConnected(Boolean(health.connected));
      }

      const { user: currentUser } = await authService.getMe();
      if (isMounted) {
        if (currentUser) {
          syncUserState(currentUser);
        }
        setIsLoading(false);
      }
    };

    initAuth();

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
    setUser(null);
    setProfile(null);
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
