import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../common/BottomNav';
import { TopHeader } from '../common/TopHeader';
import { Skeleton } from '../common/Skeleton';

const PageContentSkeleton = () => (
  <div className="space-y-4 text-left animate-in fade-in duration-150 pb-12">
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-36 rounded-xl" />
        <Skeleton className="h-3 w-48 rounded-md" />
      </div>
      <Skeleton className="h-8 w-24 rounded-xl" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
    <Skeleton className="h-40 rounded-2xl" />
  </div>
);

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col text-slate-100 selection:bg-lime selection:text-dark-950 pb-safe">
      <TopHeader />
      <main className="flex-1 max-w-md md:max-w-2xl lg:max-w-4xl w-full mx-auto px-4 pt-3 pb-36 sm:pt-5 sm:pb-36">
        <Suspense fallback={<PageContentSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
};
