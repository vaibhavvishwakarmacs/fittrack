import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CalendarDays, Dumbbell, Utensils, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    {
      label: 'Home',
      to: '/app/dashboard',
      icon: Home,
    },
    {
      label: 'Calendar',
      to: '/app/calendar',
      icon: CalendarDays,
    },
    {
      label: 'Workout',
      to: '/app/workouts',
      icon: Dumbbell,
      isCenter: true,
    },
    {
      label: 'Nutrition',
      to: '/app/nutrition',
      icon: Utensils,
    },
    {
      label: 'Profile',
      to: '/app/profile',
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-dark-900/90 backdrop-blur-xl border-t border-white/[0.08] shadow-2xl safe-bottom transition-all"
    >
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="relative -top-3 flex flex-col items-center group focus:outline-none"
                aria-label={item.label}
              >
                <div
                  className={cn(
                    'w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl border',
                    isActive
                      ? 'bg-lime text-dark-950 border-lime shadow-lime-md scale-105'
                      : 'bg-dark-850 text-slate-300 border-white/10 group-hover:border-lime/40 group-hover:text-white'
                  )}
                >
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-semibold mt-1 transition-colors',
                    isActive ? 'text-lime font-bold' : 'text-slate-400 group-hover:text-slate-300'
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 group focus:outline-none',
                  isActive ? 'text-lime' : 'text-slate-400 hover:text-slate-200'
                )
              }
              aria-label={item.label}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200 group-active:scale-90',
                    isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'
                  )}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-lime rounded-full" />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium tracking-tight mt-1 transition-colors',
                  isActive ? 'text-lime font-bold' : 'text-slate-400'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
