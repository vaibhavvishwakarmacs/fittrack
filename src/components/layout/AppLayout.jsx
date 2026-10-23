import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../common/BottomNav';
import { TopHeader } from '../common/TopHeader';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col text-slate-100 selection:bg-lime selection:text-dark-950 pb-safe">
      <TopHeader />
      <main className="flex-1 max-w-md md:max-w-2xl lg:max-w-4xl w-full mx-auto px-4 py-4 sm:py-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
