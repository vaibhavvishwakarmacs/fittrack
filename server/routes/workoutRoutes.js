import express from 'express';
import { Workout } from '../models/Workout.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/workouts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.userId }).sort({ startedAt: -1 });
    res.json({ data: workouts.map((w) => w.toJSON()) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch workouts.' });
  }
});

// POST /api/workouts
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      category,
      durationMinutes,
      notes,
      startedAt,
      targetMuscles,
      dayOfWeek,
      exercises,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Workout title is required.' });
    }

    // Calculate volume
    let totalVolume = 0;
    (exercises || []).forEach((ex) => {
      (ex.sets || []).forEach((s) => {
        if (s.isCompleted !== false) {
          totalVolume += (Number(s.reps) || 0) * (Number(s.weightKg) || 0);
        }
      });
    });

    const mins = Number(durationMinutes) || 45;
    const caloriesBurned = Math.round(mins * 6.5);

    const workout = new Workout({
      userId: req.userId,
      title,
      category: category || 'strength',
      targetMuscles: Array.isArray(targetMuscles) ? targetMuscles : [],
      dayOfWeek: dayOfWeek || null,
      durationMinutes: mins,
      totalVolumeKg: totalVolume,
      caloriesBurned,
      notes: notes || null,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      exercises: (exercises || []).map((ex, exIdx) => ({
        name: ex.name,
        category: ex.category || ex.muscle || 'chest',
        orderIndex: exIdx,
        notes: ex.notes || null,
        imageUrl: ex.imageUrl || ex.image_url || ex.image || null,
        targetMuscles: ex.targetMuscles || ex.target_muscles || (ex.muscle ? [ex.muscle] : []),
        tips: ex.tips || [],
        trackingFields: Array.isArray(ex.trackingFields || ex.tracking_fields) && (ex.trackingFields || ex.tracking_fields).length > 0
          ? (ex.trackingFields || ex.tracking_fields)
          : ['weight', 'reps'],
        defaultRestSec: Number(ex.defaultRestSec || ex.default_rest_sec) || 90,
        sets: (ex.sets || []).map((s) => ({
          setNumber: s.setNumber || s.set_number,
          reps: Number(s.reps) || 0,
          weightKg: Number(s.weightKg !== undefined ? s.weightKg : s.weight_kg) || 0,
          timeSec: Number(s.timeSec !== undefined ? s.timeSec : s.time_sec) || 0,
          distanceMeters: Number(s.distanceMeters !== undefined ? s.distanceMeters : s.distance_meters) || 0,
          calories: Number(s.calories) || 0,
          rpe: s.rpe ? Number(s.rpe) : null,
          support: s.support || 'normal',
          isCompleted: s.isCompleted !== false && s.is_completed !== false,
          completedAt: s.completedAt ? new Date(s.completedAt) : null,
        })),
      })),
    });

    await workout.save();
    res.status(201).json({ data: workout.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to save workout.' });
  }
});

// PUT /api/workouts/:id - Edit workout
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, category, durationMinutes, notes } = req.body;

    const workout = await Workout.findOne({ _id: req.params.id, userId: req.userId });
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found.' });
    }

    if (title) workout.title = title;
    if (category) workout.category = category;
    if (durationMinutes !== undefined) {
      workout.durationMinutes = Number(durationMinutes) || workout.durationMinutes;
      workout.caloriesBurned = Math.round(workout.durationMinutes * 6.5);
    }
    if (notes !== undefined) workout.notes = notes;

    await workout.save();
    res.json({ data: workout.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update workout.' });
  }
});

// DELETE /api/workouts/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Workout.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) {
      return res.status(404).json({ error: 'Workout not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete workout.' });
  }
});

export default router;
