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

    // If opened directly in browser/Safari (via "Open URL"), return a sleek dark confirmation screen
    if (req.headers.accept && req.headers.accept.includes('text/html') && !req.query.json) {
      return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>FitTrack • Steps Synced</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #07090f;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #0f131f;
      border: 1px solid rgba(187, 244, 61, 0.3);
      border-radius: 28px;
      padding: 36px 24px;
      width: 100%;
      max-width: 360px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(187, 244, 61, 0.1);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(187, 244, 61, 0.12);
      border: 1px solid rgba(187, 244, 61, 0.3);
      color: #bbf43d;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .steps {
      font-size: 46px;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: #bbf43d;
      line-height: 1;
      margin-bottom: 6px;
    }
    .label {
      color: #94a3b8;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 24px;
    }
    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 24px;
    }
    .metric {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 12px;
    }
    .metric-val {
      font-size: 16px;
      font-weight: 800;
      color: #fff;
    }
    .metric-lbl {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      border-radius: 16px;
      background: #bbf43d;
      color: #07090f;
      text-decoration: none;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: -0.01em;
      transition: transform 0.15s ease;
    }
    .btn:active {
      transform: scale(0.97);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">⚡ Apple Health Synced</div>
    <div class="steps">${s.toLocaleString()}</div>
    <div class="label">Steps successfully saved for today</div>
    <div class="metrics">
      <div class="metric">
        <div class="metric-val">${dist} km</div>
        <div class="metric-lbl">Distance</div>
      </div>
      <div class="metric">
        <div class="metric-val">${cals} kcal</div>
        <div class="metric-lbl">Active Burn</div>
      </div>
    </div>
    <a href="/app/activity" class="btn">Open FitTrack App →</a>
  </div>
</body>
</html>`);
    }

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
