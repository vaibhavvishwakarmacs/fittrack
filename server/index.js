import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import nutritionRoutes from './routes/nutritionRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import weightRoutes from './routes/weightRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fittrack';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve('uploads')));

// Health check endpoint
let isMongoConnected = false;
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    backend: 'Express + Node.js',
    database: 'MongoDB',
    connected: isMongoConnected,
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/upload', uploadRoutes);

// Serve static frontend assets in production
const distPath = path.resolve('dist');
app.use(express.static(distPath));

// SPA client-side routing fallback (all non-API routes return index.html)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    isMongoConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${MONGODB_URI}`);
  })
  .catch((err) => {
    isMongoConnected = false;
    console.warn(`[MongoDB] Warning: Could not connect to MongoDB (${err.message}).`);
    console.warn(`[MongoDB] Operating with local client-side fallback until MongoDB is reachable.`);
  });

app.listen(PORT, () => {
  console.log(`[FitTrack Server] Running on http://localhost:${PORT}`);
});

export default app;
