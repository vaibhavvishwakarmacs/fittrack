import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={`bg-white/[0.04] rounded-2xl animate-pulse relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.05] before:to-transparent ${className}`}
    />
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-4 text-left animate-in fade-in pb-10">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-lg" />
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>

      {/* Today's Workout Glance Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>

      {/* Macro Ring Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-40 rounded-md" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
};

export const NutritionSkeleton = () => {
  return (
    <div className="space-y-4 text-left animate-in fade-in pb-12">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-40 rounded-xl" />
          <Skeleton className="h-3 w-56 rounded-md" />
        </div>
        <Skeleton className="h-10 w-36 rounded-2xl" />
      </div>

      {/* Macro Ring Skeleton */}
      <Skeleton className="h-44 rounded-2xl" />

      {/* 4 Meal Rows Skeleton */}
      <div className="space-y-2.5">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
      </div>

      {/* Water Tracker Skeleton */}
      <Skeleton className="h-28 rounded-2xl" />
    </div>
  );
};

export const WorkoutsSkeleton = () => {
  return (
    <div className="space-y-4 text-left animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-44 rounded-xl" />
          <Skeleton className="h-3 w-64 rounded-md" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      {/* 3-Stat Summary Banner */}
      <Skeleton className="h-20 rounded-2xl" />

      {/* Category Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24 rounded-xl" />
        <Skeleton className="h-8 w-20 rounded-xl" />
        <Skeleton className="h-8 w-24 rounded-xl" />
        <Skeleton className="h-8 w-16 rounded-xl" />
      </div>

      {/* Workout Cards */}
      <div className="space-y-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </div>
  );
};

export const ActivitySkeleton = () => {
  return (
    <div className="space-y-4 text-left animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-40 rounded-xl" />
          <Skeleton className="h-3 w-56 rounded-md" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Hero Step Card */}
      <Skeleton className="h-36 rounded-2xl" />

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>

      {/* 7-day Bar Chart */}
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
};
