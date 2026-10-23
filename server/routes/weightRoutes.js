import express from 'express';
import { Weight } from '../models/Weight.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/weight
router.get('/', authMiddleware, async (req, res) => {
  try {
    const weights = await Weight.find({ userId: req.userId }).sort({ date: 1 });
    res.json({ data: weights.map((w) => w.toJSON()) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch weight logs.' });
  }
});

// POST /api/weight
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, weightKg, bodyFatPercentage, notes, photoUrl } = req.body;

    if (!date || !weightKg) {
      return res.status(400).json({ error: 'Date and weightKg are required.' });
    }

    const weight = new Weight({
      userId: req.userId,
      date,
      weightKg: Number(weightKg),
      bodyFatPercentage: bodyFatPercentage ? Number(bodyFatPercentage) : null,
      notes: notes || null,
      photoUrl: photoUrl || null,
    });

    await weight.save();
    res.status(201).json({ data: weight.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to record weight.' });
  }
});

// DELETE /api/weight/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Weight.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) {
      return res.status(404).json({ error: 'Weight log not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete weight log.' });
  }
});

export default router;
