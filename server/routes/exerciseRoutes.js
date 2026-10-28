import express from 'express';
import { CustomExercise } from '../models/CustomExercise.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/exercises/custom - list custom exercises for authenticated user
router.get('/custom', authMiddleware, async (req, res) => {
  try {
    const exercises = await CustomExercise.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ data: exercises.map((ex) => ex.toJSON()) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch custom exercises.' });
  }
});

// POST /api/exercises/custom - create a new custom exercise variation or preset override
router.post('/custom', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      muscle,
      target,
      tips,
      image,
      defaultRestSec,
      trackingFields,
      isPresetOverride,
      originalPresetName,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Exercise name is required.' });
    }
    if (!muscle) {
      return res.status(400).json({ error: 'Muscle group is required.' });
    }

    const cleanTrackingFields = Array.isArray(trackingFields) && trackingFields.length > 0
      ? trackingFields
      : ['weight', 'reps'];

    // If overriding a preset, check if user already has an existing override for this preset
    if (isPresetOverride && originalPresetName) {
      let existingOverride = await CustomExercise.findOne({
        userId: req.userId,
        originalPresetName: originalPresetName.trim(),
      });

      if (existingOverride) {
        existingOverride.name = name.trim();
        existingOverride.muscle = muscle.toLowerCase();
        existingOverride.target = target ? target.trim() : existingOverride.target;
        existingOverride.tips = Array.isArray(tips) ? tips : tips ? [tips] : existingOverride.tips;
        existingOverride.image = image !== undefined ? image : existingOverride.image;
        existingOverride.defaultRestSec = Number(defaultRestSec) || existingOverride.defaultRestSec || 90;
        existingOverride.trackingFields = cleanTrackingFields;
        existingOverride.isPresetOverride = true;

        await existingOverride.save();
        return res.json({ data: existingOverride.toJSON() });
      }
    }

    const customEx = new CustomExercise({
      userId: req.userId,
      name: name.trim(),
      muscle: muscle.toLowerCase(),
      target: target ? target.trim() : `${muscle.toUpperCase()} Hypertrophy`,
      tips: Array.isArray(tips) ? tips : tips ? [tips] : ['Maintain strict form throughout movement.'],
      image: image || null,
      defaultRestSec: Number(defaultRestSec) || 90,
      trackingFields: cleanTrackingFields,
      isPresetOverride: Boolean(isPresetOverride),
      originalPresetName: originalPresetName ? originalPresetName.trim() : null,
    });

    await customEx.save();
    res.status(201).json({ data: customEx.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to save custom exercise.' });
  }
});

// PUT /api/exercises/custom/:id - update an existing exercise or override
router.put('/custom/:id', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      muscle,
      target,
      tips,
      image,
      defaultRestSec,
      trackingFields,
      isPresetOverride,
      originalPresetName,
    } = req.body;

    const exercise = await CustomExercise.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found.' });
    }

    if (name) exercise.name = name.trim();
    if (muscle) exercise.muscle = muscle.toLowerCase();
    if (target !== undefined) exercise.target = target.trim();
    if (tips !== undefined) exercise.tips = Array.isArray(tips) ? tips : [tips];
    if (image !== undefined) exercise.image = image;
    if (defaultRestSec !== undefined) exercise.defaultRestSec = Number(defaultRestSec) || 90;
    if (trackingFields !== undefined) {
      exercise.trackingFields = Array.isArray(trackingFields) && trackingFields.length > 0 ? trackingFields : ['weight', 'reps'];
    }
    if (isPresetOverride !== undefined) exercise.isPresetOverride = Boolean(isPresetOverride);
    if (originalPresetName !== undefined) exercise.originalPresetName = originalPresetName;

    await exercise.save();
    res.json({ data: exercise.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update exercise.' });
  }
});

// POST /api/exercises/reset-preset - reset an overridden preset back to factory default
router.post('/reset-preset', authMiddleware, async (req, res) => {
  try {
    const { presetName } = req.body;
    if (!presetName) {
      return res.status(400).json({ error: 'Preset name is required.' });
    }

    await CustomExercise.deleteMany({
      userId: req.userId,
      originalPresetName: presetName.trim(),
    });

    res.json({ success: true, message: `Reset "${presetName}" to default.` });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to reset preset exercise.' });
  }
});

// DELETE /api/exercises/custom/:id - remove custom exercise or preset override
router.delete('/custom/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await CustomExercise.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!deleted) {
      return res.status(404).json({ error: 'Custom exercise not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete custom exercise.' });
  }
});

export default router;
