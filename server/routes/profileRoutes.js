import express from 'express';
import { User } from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// PUT /api/profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    const allowedFields = [
      'fullName',
      'avatarUrl',
      'fitnessGoal',
      'activityLevel',
      'gender',
      'currentWeightKg',
      'targetWeightKg',
      'heightCm',
      'dailyCalorieTarget',
      'dailyProteinTargetG',
      'dailyCarbsTargetG',
      'dailyFatTargetG',
      'dailyStepTarget',
      'dailyWaterTargetMl',
      'unitSystem',
      'onboardingCompleted',
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
      // Also map snake_case from legacy clients if provided
      const camelCaseKey = key
        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (req.body[camelCaseKey] !== undefined) {
        updates[key] = req.body[camelCaseKey];
      }
    }

    // Handle snake_case mappings
    if (req.body.full_name !== undefined) updates.fullName = req.body.full_name;
    if (req.body.avatar_url !== undefined) updates.avatarUrl = req.body.avatar_url;
    if (req.body.fitness_goal !== undefined) updates.fitnessGoal = req.body.fitness_goal;
    if (req.body.activity_level !== undefined) updates.activityLevel = req.body.activity_level;
    if (req.body.current_weight_kg !== undefined) updates.currentWeightKg = req.body.current_weight_kg;
    if (req.body.target_weight_kg !== undefined) updates.targetWeightKg = req.body.target_weight_kg;
    if (req.body.height_cm !== undefined) updates.heightCm = req.body.height_cm;
    if (req.body.daily_calorie_target !== undefined) updates.dailyCalorieTarget = req.body.daily_calorie_target;
    if (req.body.daily_protein_target_g !== undefined) updates.dailyProteinTargetG = req.body.daily_protein_target_g;
    if (req.body.daily_carbs_target_g !== undefined) updates.dailyCarbsTargetG = req.body.daily_carbs_target_g;
    if (req.body.daily_fat_target_g !== undefined) updates.dailyFatTargetG = req.body.daily_fat_target_g;
    if (req.body.daily_step_target !== undefined) updates.dailyStepTarget = req.body.daily_step_target;
    if (req.body.daily_water_target_ml !== undefined) updates.dailyWaterTargetMl = req.body.daily_water_target_ml;
    if (req.body.unit_system !== undefined) updates.unitSystem = req.body.unit_system;
    if (req.body.onboarding_completed !== undefined) updates.onboardingCompleted = req.body.onboarding_completed;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update profile.' });
  }
});

export default router;
