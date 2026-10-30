// High-speed route chunk preloader for 0ms tab transitions
export const routeLoaders = {
  '/app/dashboard': () => import('../pages/app/DashboardPage'),
  '/app/calendar': () => import('../pages/app/CalendarPage'),
  '/app/workouts': () => import('../pages/app/WorkoutsPage'),
  '/app/nutrition': () => import('../pages/app/NutritionPage'),
  '/app/activity': () => import('../pages/app/ActivityPage'),
  '/app/profile': () => import('../pages/app/ProfilePage'),
  '/app/settings': () => import('../pages/app/SettingsPage'),
};

const preloadedPaths = new Set();

export const prefetchRoute = (path) => {
  if (preloadedPaths.has(path)) return;
  const loader = routeLoaders[path];
  if (loader) {
    preloadedPaths.add(path);
    loader().catch(() => {
      preloadedPaths.delete(path);
    });
  }
};

export const prefetchAllMainRoutes = () => {
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
  idle(() => {
    Object.keys(routeLoaders).forEach((path) => {
      prefetchRoute(path);
    });
  });
};
