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

// POST /api/exercises/custom - create a new custom exercise variation
router.post('/custom', authMiddleware, async (req, res) => {
  try {
    const { name, muscle, target, tips, image, defaultRestSec } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Exercise name is required.' });
    }
    if (!muscle) {
      return res.status(400).json({ error: 'Muscle group is required.' });
    }

    const customEx = new CustomExercise({
      userId: req.userId,
      name: name.trim(),
      muscle: muscle.toLowerCase(),
      target: target ? target.trim() : `${muscle.toUpperCase()} Hypertrophy`,
      tips: Array.isArray(tips) ? tips : tips ? [tips] : ['Maintain strict form throughout movement.'],
      image: image || null,
      defaultRestSec: Number(defaultRestSec) || 90,
    });

    await customEx.save();
    res.status(201).json({ data: customEx.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to save custom exercise.' });
  }
});

// DELETE /api/exercises/custom/:id - remove custom exercise
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
