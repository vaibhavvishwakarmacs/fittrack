import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AppSplashScreen } from '../components/common/AppSplashScreen';
import { prefetchAllMainRoutes, prefetchRoute } from './pagePrefetch';

// Explicit loaders for idle prefetching
const loadLoginPage = () => import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }));
const loadSignupPage = () => import('../pages/auth/SignupPage').then((m) => ({ default: m.SignupPage }));
const loadOnboardingPage = () => import('../pages/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage }));

const loadDashboardPage = () => import('../pages/app/DashboardPage').then((m) => ({ default: m.DashboardPage }));
const loadCalendarPage = () => import('../pages/app/CalendarPage').then((m) => ({ default: m.CalendarPage }));
const loadWorkoutsPage = () => import('../pages/app/WorkoutsPage').then((m) => ({ default: m.WorkoutsPage }));
const loadNutritionPage = () => import('../pages/app/NutritionPage').then((m) => ({ default: m.NutritionPage }));
const loadActivityPage = () => import('../pages/app/ActivityPage').then((m) => ({ default: m.ActivityPage }));
const loadProfilePage = () => import('../pages/app/ProfilePage').then((m) => ({ default: m.ProfilePage }));
const loadSettingsPage = () => import('../pages/app/SettingsPage').then((m) => ({ default: m.SettingsPage }));
const loadWorkoutSessionPage = () => import('../pages/app/WorkoutSessionPage').then((m) => ({ default: m.WorkoutSessionPage }));
const loadNotFoundPage = () => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }));

const LoginPage = lazy(loadLoginPage);
const SignupPage = lazy(loadSignupPage);
const OnboardingPage = lazy(loadOnboardingPage);
const DashboardPage = lazy(loadDashboardPage);
const CalendarPage = lazy(loadCalendarPage);
const WorkoutsPage = lazy(loadWorkoutsPage);
const NutritionPage = lazy(loadNutritionPage);
const ActivityPage = lazy(loadActivityPage);
const ProfilePage = lazy(loadProfilePage);
const SettingsPage = lazy(loadSettingsPage);
const WorkoutSessionPage = lazy(loadWorkoutSessionPage);
const NotFoundPage = lazy(loadNotFoundPage);

const RedirectWithSearch = ({ to }) => {
  const { search } = window.location;
  return <Navigate to={`${to}${search || ''}`} replace />;
};

export const AppRoutes = () => {
  // Eagerly prefetch main app chunks right away so tab clicks are instant
  useEffect(() => {
    prefetchAllMainRoutes();
  }, []);

  return (
    <Suspense fallback={<AppSplashScreen message="Opening FitTrack..." />}>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

        {/* Top-Level Aliases & Shortcut Sync */}
        <Route path="/sync" element={<RedirectWithSearch to="/app/activity" />} />
        <Route path="/sync-steps" element={<RedirectWithSearch to="/app/activity" />} />
        <Route path="/activity" element={<RedirectWithSearch to="/app/activity" />} />
        <Route path="/dashboard" element={<RedirectWithSearch to="/app/dashboard" />} />
        <Route path="/calendar" element={<RedirectWithSearch to="/app/calendar" />} />
        <Route path="/workouts" element={<RedirectWithSearch to="/app/workouts" />} />
        <Route path="/nutrition" element={<RedirectWithSearch to="/app/nutrition" />} />
        <Route path="/profile" element={<RedirectWithSearch to="/app/profile" />} />

        {/* Public Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Onboarding Flow */}
        <Route element={<ProtectedRoute requireOnboarding={false} />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>

        {/* Main Authenticated App Routes with Persistent AppLayout */}
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
            <Route path="session" element={<WorkoutSessionPage />} />
          </Route>
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
