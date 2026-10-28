import express from 'express';
import { Nutrition } from '../models/Nutrition.js';
import { Water } from '../models/Water.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/nutrition/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/range', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate query parameters required.' });
    }

    const [foodLogs, waterLogs] = await Promise.all([
      Nutrition.find({ userId: req.userId, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 }),
      Water.find({ userId: req.userId, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 }),
    ]);

    res.json({
      foodLogs: foodLogs.map((item) => item.toJSON()),
      waterLogs: waterLogs.map((item) => item.toJSON()),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch nutrition range.' });
  }
});

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
    const { date, mealType, foodName, servingSize, calories, proteinG, carbsG, fatG, photoUrl, photo_url, notes, description } = req.body;

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
      notes: notes || description || '',
    });

    await item.save();
    res.status(201).json({ data: item.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to add food log.' });
  }
});

// PUT /api/nutrition/food/:id - Edit food entry
router.put('/food/:id', authMiddleware, async (req, res) => {
  try {
    const { date, mealType, foodName, servingSize, calories, proteinG, carbsG, fatG, photoUrl, photo_url, notes, description } = req.body;

    const item = await Nutrition.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) {
      return res.status(404).json({ error: 'Food entry not found.' });
    }

    if (date) item.date = date;
    if (mealType) item.mealType = mealType;
    if (foodName) item.foodName = foodName;
    if (servingSize !== undefined) item.servingSize = servingSize;
    if (calories !== undefined) item.calories = Number(calories) || 0;
    if (proteinG !== undefined) item.proteinG = Number(proteinG) || 0;
    if (carbsG !== undefined) item.carbsG = Number(carbsG) || 0;
    if (fatG !== undefined) item.fatG = Number(fatG) || 0;
    if (photoUrl !== undefined || photo_url !== undefined) {
      item.photoUrl = photoUrl || photo_url || null;
    }
    if (notes !== undefined || description !== undefined) {
      item.notes = notes || description || '';
    }

    await item.save();
    res.json({ data: item.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update food log.' });
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
