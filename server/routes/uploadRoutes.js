import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 1. Cloudinary Configuration
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('[Cloudinary] Configured successfully for image uploads.');
} else {
  console.log('[Cloudinary] Cloud name missing or incomplete credentials. Local/in-memory fallback active.');
}

// 2. Multer Memory Storage (for streaming directly to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB
});

// Helper: Stream buffer directly to Cloudinary into specified folder
const uploadBufferToCloudinary = (buffer, folder = 'GYM') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// 3. Fallback disk storage setup
const localUploadDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.resolve('uploads');

try {
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }
} catch (e) {
  // Ephemeral environment
}

// POST /api/upload
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    // Determine user folder name (e.g. 'vaibhav')
    let userFolderName = 'vaibhav';
    if (req.user?.fullName) {
      userFolderName = req.user.fullName.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
    } else if (req.user?.email) {
      userFolderName = req.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
    }

    // Category: 'food', 'gym', 'avatar', 'progress'
    const rawCategory = req.body?.category || req.body?.folder || 'gym';
    const cleanCategory = rawCategory.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    // Folder structure: GYM/<user>/<category>
    const targetFolder = `GYM/${userFolderName}/${cleanCategory}`;

    // Upload to Cloudinary if configured
    if (hasCloudinary) {
      try {
        const cloudResult = await uploadBufferToCloudinary(file.buffer, targetFolder);
        return res.json({
          url: cloudResult.secure_url,
          provider: 'cloudinary',
          publicId: cloudResult.public_id,
          folder: targetFolder,
        });
      } catch (cloudErr) {
        console.error('[Cloudinary] Upload failed:', cloudErr.message);
      }
    }

    // Local Disk Fallback
    try {
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
      const filePath = path.join(localUploadDir, filename);

      fs.writeFileSync(filePath, file.buffer);
      const fileUrl = `/uploads/${filename}`;
      return res.json({ url: fileUrl, provider: 'local', folder: targetFolder });
    } catch (diskErr) {
      // In-memory base64 Data URI fallback for serverless environments
      const base64Data = file.buffer.toString('base64');
      const dataUri = `data:${file.mimetype || 'image/jpeg'};base64,${base64Data}`;
      return res.json({ url: dataUri, provider: 'base64', folder: targetFolder });
    }
  } catch (err) {
    console.error('[Upload Route] Error:', err);
    res.status(500).json({ error: err.message || 'File upload failed.' });
  }
});

export default router;
