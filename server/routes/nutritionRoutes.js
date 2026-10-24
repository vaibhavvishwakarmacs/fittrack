import express from 'express';
import { Nutrition } from '../models/Nutrition.js';
import { Water } from '../models/Water.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/nutrition?date=YYYY-MM-DD
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required.' });
    }

    const [foodLogs, waterLogs] = await Promise.all([
      Nutrition.find({ userId: req.userId, date }).sort({ createdAt: 1 }),
      Water.find({ userId: req.userId, date }).sort({ createdAt: 1 }),
    ]);

    const totalWaterMl = waterLogs.reduce((acc, curr) => acc + curr.amountMl, 0);

    res.json({
      data: foodLogs.map((item) => item.toJSON()),
      waterLogs: waterLogs.map((item) => item.toJSON()),
      totalWaterMl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch nutrition logs.' });
  }
});

// POST /api/nutrition/food
router.post('/food', authMiddleware, async (req, res) => {
  try {
    const { date, mealType, foodName, servingSize, calories, proteinG, carbsG, fatG, photoUrl, photo_url } = req.body;

    if (!date || !mealType || !foodName || calories === undefined) {
      return res.status(400).json({ error: 'Date, mealType, foodName, and calories are required.' });
    }

    const item = new Nutrition({
      userId: req.userId,
      date,
      mealType,
      foodName,
      servingSize: servingSize || '1 serving',
      calories: Number(calories) || 0,
      proteinG: Number(proteinG) || 0,
      carbsG: Number(carbsG) || 0,
      fatG: Number(fatG) || 0,
      photoUrl: photoUrl || photo_url || null,
    });

    await item.save();
    res.status(201).json({ data: item.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to add food log.' });
  }
});

// DELETE /api/nutrition/food/:id
router.delete('/food/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Nutrition.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) {
      return res.status(404).json({ error: 'Food log not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete food log.' });
  }
});

// POST /api/nutrition/water
router.post('/water', authMiddleware, async (req, res) => {
  try {
    const { date, amountMl } = req.body;

    if (!date || !amountMl) {
      return res.status(400).json({ error: 'Date and amountMl are required.' });
    }

    const water = new Water({
      userId: req.userId,
      date,
      amountMl: Number(amountMl),
    });

    await water.save();
    res.status(201).json({ data: water.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to record water.' });
  }
});

export default router;
