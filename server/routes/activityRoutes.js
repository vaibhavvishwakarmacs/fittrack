import express from 'express';
import { Activity } from '../models/Activity.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/activity?date=YYYY-MM-DD
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required.' });
    }

    const activity = await Activity.findOne({ userId: req.userId, date });
    res.json({ data: activity ? activity.toJSON() : null });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch activity.' });
  }
});

// GET /api/activity/range?startDate=...&endDate=...
router.get('/range', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate query parameters required.' });
    }

    const activities = await Activity.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    res.json({ data: activities.map((a) => a.toJSON()) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch activity range.' });
  }
});

// POST /api/activity
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, steps, distanceKm, activeCalories, durationMinutes, notes } = req.body;

    if (!date || steps === undefined) {
      return res.status(400).json({ error: 'Date and steps are required.' });
    }

    const s = Number(steps) || 0;
    const dist = distanceKm !== undefined ? Number(distanceKm) : Math.round(s * 0.00075 * 100) / 100;
    const cals = activeCalories !== undefined ? Number(activeCalories) : Math.round(s * 0.04);
    const mins = durationMinutes !== undefined ? Number(durationMinutes) : Math.round(s / 100);

    const activity = await Activity.findOneAndUpdate(
      { userId: req.userId, date },
      {
        steps: s,
        distanceKm: dist,
        activeCalories: cals,
        durationMinutes: mins,
        notes: notes || null,
      },
      { new: true, upsert: true }
    );

    res.json({ data: activity.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update activity.' });
  }
});

export default router;
