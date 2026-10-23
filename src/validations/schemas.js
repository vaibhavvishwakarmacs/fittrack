import { z } from 'zod';

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const onboardingSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  fitnessGoal: z.enum(['build_muscle', 'lose_fat', 'maintain', 'endurance', 'strength', 'general_health']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'very_active', 'extra_active']),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  unitSystem: z.enum(['metric', 'imperial']),
  currentWeight: z.coerce.number().positive('Must be greater than 0'),
  targetWeight: z.coerce.number().positive('Must be greater than 0'),
  height: z.coerce.number().positive('Must be greater than 0'),
  dailyCalorieTarget: z.coerce.number().min(800, 'Minimum 800 kcal').max(10000, 'Maximum 10000 kcal'),
  dailyProteinTarget: z.coerce.number().min(0, 'Cannot be negative'),
  dailyCarbsTarget: z.coerce.number().min(0, 'Cannot be negative'),
  dailyFatTarget: z.coerce.number().min(0, 'Cannot be negative'),
  dailyStepTarget: z.coerce.number().min(1000, 'Minimum 1,000 steps').max(50000, 'Maximum 50,000 steps'),
  dailyWaterTarget: z.coerce.number().min(500, 'Minimum 500 ml').max(10000, 'Maximum 10,000 ml'),
});

export const workoutFormSchema = z.object({
  title: z.string().min(2, 'Workout name required'),
  category: z.enum(['strength', 'hypertrophy', 'cardio', 'hiit', 'flexibility', 'other']),
  durationMinutes: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  notes: z.string().optional(),
});

export const exerciseSetSchema = z.object({
  setNumber: z.number().int().positive(),
  reps: z.coerce.number().int().min(0, 'Reps cannot be negative'),
  weightKg: z.coerce.number().min(0, 'Weight cannot be negative'),
  rpe: z.coerce.number().min(1).max(10).optional().nullable(),
  isCompleted: z.boolean().default(true),
});

export const nutritionFormSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foodName: z.string().min(2, 'Food name required'),
  servingSize: z.string().default('1 serving'),
  calories: z.coerce.number().min(0, 'Calories cannot be negative'),
  proteinG: z.coerce.number().min(0, 'Protein cannot be negative').default(0),
  carbsG: z.coerce.number().min(0, 'Carbs cannot be negative').default(0),
  fatG: z.coerce.number().min(0, 'Fat cannot be negative').default(0),
});

export const waterFormSchema = z.object({
  amountMl: z.coerce.number().int().min(50, 'Minimum 50 ml').max(3000, 'Maximum 3000 ml per log'),
});

export const activityFormSchema = z.object({
  steps: z.coerce.number().int().min(0, 'Steps cannot be negative'),
  distanceKm: z.coerce.number().min(0, 'Distance cannot be negative').default(0),
  activeCalories: z.coerce.number().int().min(0, 'Calories cannot be negative').default(0),
  durationMinutes: z.coerce.number().int().min(0, 'Duration cannot be negative').default(0),
  notes: z.string().optional(),
});

export const weightFormSchema = z.object({
  weightKg: z.coerce.number().positive('Weight must be greater than 0'),
  bodyFatPercentage: z.coerce.number().min(1).max(70).optional().nullable(),
  notes: z.string().optional(),
  photoUrl: z.string().optional().nullable(),
});

export const profileSettingsSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  fitnessGoal: z.enum(['build_muscle', 'lose_fat', 'maintain', 'endurance', 'strength', 'general_health']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'very_active', 'extra_active']),
  unitSystem: z.enum(['metric', 'imperial']),
  currentWeightKg: z.coerce.number().positive('Must be greater than 0'),
  targetWeightKg: z.coerce.number().positive('Must be greater than 0'),
  heightCm: z.coerce.number().positive('Must be greater than 0'),
  dailyCalorieTarget: z.coerce.number().min(800),
  dailyProteinTargetG: z.coerce.number().min(0),
  dailyCarbsTargetG: z.coerce.number().min(0),
  dailyFatTargetG: z.coerce.number().min(0),
  dailyStepTarget: z.coerce.number().min(1000),
  dailyWaterTargetMl: z.coerce.number().min(500),
});
