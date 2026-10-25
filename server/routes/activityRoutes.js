import express from 'express';
import jwt from 'jsonwebtoken';
import { Activity } from '../models/Activity.js';
import { User } from '../models/User.js';
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

// GET /api/activity/sync?email=...&steps=...&date=... (100% background sync for Apple Shortcuts)
router.get('/sync', async (req, res) => {
  try {
    const rawSteps = req.query.steps;
    if (rawSteps === undefined) {
      return res.status(400).json({ error: 'Steps query parameter is required.' });
    }

    let targetUserId = null;

    // 1. Resolve user by email
    if (req.query.email) {
      const u = await User.findOne({ email: req.query.email.trim().toLowerCase() });
      if (u) targetUserId = u._id.toString();
    }

    // 2. Resolve user by token
    if (!targetUserId) {
      const authHeader = req.headers.authorization;
      const queryToken = req.query.token;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : queryToken;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fittrack-super-secret-jwt-key-2025');
          targetUserId = decoded.userId;
        } catch {}
      }
    }

    // 3. Fallback to first user in system
    if (!targetUserId) {
      const firstUser = await User.findOne().sort({ createdAt: 1 });
      if (firstUser) targetUserId = firstUser._id.toString();
    }

    if (!targetUserId) {
      return res.status(401).json({ error: 'User could not be identified for step sync.' });
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const targetDate = req.query.date || todayDate;
    const s = Number(rawSteps) || 0;
    const dist = Math.round(s * 0.00075 * 100) / 100;
    const cals = Math.round(s * 0.04);
    const mins = Math.round(s / 100);

    const activity = await Activity.findOneAndUpdate(
      { userId: targetUserId, date: targetDate },
      {
        steps: s,
        distanceKm: dist,
        activeCalories: cals,
        durationMinutes: mins,
        notes: 'Synced via Apple Health Shortcut',
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: `Synced ${s.toLocaleString()} steps for ${targetDate}`,
      steps: s,
      data: activity.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to sync activity.' });
  }
});

export default router;
