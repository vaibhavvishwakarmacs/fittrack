import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardSkeleton } from '../components/common/Skeleton';

// Lazy-Loaded Pages for Ultra-Fast Initial PWA Bundle & Instant Page Switching
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('../pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })));
const OnboardingPage = lazy(() => import('../pages/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));

const DashboardPage = lazy(() => import('../pages/app/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CalendarPage = lazy(() => import('../pages/app/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const WorkoutsPage = lazy(() => import('../pages/app/WorkoutsPage').then((m) => ({ default: m.WorkoutsPage })));
const NutritionPage = lazy(() => import('../pages/app/NutritionPage').then((m) => ({ default: m.NutritionPage })));
const ActivityPage = lazy(() => import('../pages/app/ActivityPage').then((m) => ({ default: m.ActivityPage })));
const ProfilePage = lazy(() => import('../pages/app/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('../pages/app/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const WorkoutSessionPage = lazy(() => import('../pages/app/WorkoutSessionPage').then((m) => ({ default: m.WorkoutSessionPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

export const AppRoutes = () => {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
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
            <Route path="session" element={<WorkoutSessionPage />} />
          </Route>
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
