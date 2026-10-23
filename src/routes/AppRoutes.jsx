import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { OnboardingPage } from '../pages/onboarding/OnboardingPage';

// App Pages
import { DashboardPage } from '../pages/app/DashboardPage';
import { CalendarPage } from '../pages/app/CalendarPage';
import { WorkoutsPage } from '../pages/app/WorkoutsPage';
import { NutritionPage } from '../pages/app/NutritionPage';
import { ActivityPage } from '../pages/app/ActivityPage';
import { ProfilePage } from '../pages/app/ProfilePage';
import { SettingsPage } from '../pages/app/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Onboarding Flow (Requires Authenticated Session, but bypasses completed onboarding check) */}
      <Route element={<ProtectedRoute requireOnboarding={false} />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      {/* Main Authenticated App Routes with AppLayout & Persistent Bottom Navigation */}
      <Route element={<ProtectedRoute requireOnboarding={true} />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="nutrition" element={<NutritionPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
