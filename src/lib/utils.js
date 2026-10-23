import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDateToISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateString) {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

export function formatWeight(kg, unit = 'metric') {
  if (unit === 'imperial') {
    const lbs = kg * 2.20462;
    return `${lbs.toFixed(1)} lbs`;
  }
  return `${kg.toFixed(1)} kg`;
}

export function formatDistance(km, unit = 'metric') {
  if (unit === 'imperial') {
    const miles = km * 0.621371;
    return `${miles.toFixed(2)} mi`;
  }
  return `${km.toFixed(2)} km`;
}

export function calculateMacroCalories(proteinG, carbsG, fatG) {
  return Math.round(proteinG * 4 + carbsG * 4 + fatG * 9);
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
