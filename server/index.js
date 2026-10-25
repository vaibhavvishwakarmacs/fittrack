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
import exerciseRoutes from './routes/exerciseRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fittrack';

// Middleware
app.use(cors());
app.use(express.json());

const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.resolve('uploads');
app.use('/uploads', express.static(uploadDir));

// MongoDB Connection Caching for Serverless (Vercel)
let cachedPromise = null;

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      })
      .then((mongooseInstance) => {
        console.log(`[MongoDB] Connected successfully.`);
        return mongooseInstance;
      })
      .catch((err) => {
        console.warn(`[MongoDB] Connection warning: ${err.message}`);
        cachedPromise = null;
        return null;
      });
  }

  return cachedPromise;
}

// Ensure DB is connected for every incoming request
app.use(async (_req, _res, next) => {
  await connectToDatabase();
  next();
});

// Health check endpoint
const healthHandler = (_req, res) => {
  res.json({
    status: 'ok',
    backend: 'Express + Node.js',
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Standalone Server',
    database: 'MongoDB',
    connected: mongoose.connection.readyState === 1,
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Route registration helper for both /api/xxx and /xxx
const registerRoutes = (prefix = '') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/profile`, profileRoutes);
  app.use(`${prefix}/workouts`, workoutRoutes);
  app.use(`${prefix}/nutrition`, nutritionRoutes);
  app.use(`${prefix}/activity`, activityRoutes);
  app.use(`${prefix}/weight`, weightRoutes);
  app.use(`${prefix}/upload`, uploadRoutes);
  app.use(`${prefix}/exercises`, exerciseRoutes);
  app.use(`${prefix}/ai`, aiRoutes);
};

// Mount for standard /api routes and root fallback
registerRoutes('/api');
registerRoutes('');

// Serve static frontend assets in standalone production (non-Vercel)
if (!process.env.VERCEL) {
  const distPath = path.resolve('dist');
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) next();
      });
    }
    next();
  });
}

// Only listen when running standalone (not in Vercel serverless environment)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[FitTrack Server] Running on http://localhost:${PORT}`);
  });
}

export default app;
