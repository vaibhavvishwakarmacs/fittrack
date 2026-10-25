import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
});

// Helper: Convert URL or file to base64 & MIME type
const resolveImageBase64 = async (req) => {
  if (req.file && req.file.buffer) {
    return {
      base64: req.file.buffer.toString('base64'),
      mimeType: req.file.mimetype || 'image/jpeg',
    };
  }

  const rawBase64 = req.body?.imageBase64;
  if (rawBase64) {
    if (rawBase64.startsWith('data:')) {
      const match = rawBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], base64: match[2] };
      }
    }
    return { mimeType: 'image/jpeg', base64: rawBase64 };
  }

  const imageUrl = req.body?.imageUrl;
  if (imageUrl) {
    if (imageUrl.startsWith('data:')) {
      const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], base64: match[2] };
      }
    }

    // Local /uploads/ disk file
    if (imageUrl.startsWith('/uploads/') || imageUrl.includes('/uploads/')) {
      const filename = path.basename(imageUrl.split('?')[0]);
      const localDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.resolve('uploads');
      const filePath = path.join(localDir, filename);
      if (fs.existsSync(filePath)) {
        const fileBuf = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        return { mimeType: mime, base64: fileBuf.toString('base64') };
      }
    }

    // Remote HTTP / HTTPS image (e.g. Cloudinary)
    const res = await fetch(imageUrl);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const arrayBuf = await res.arrayBuffer();
      return { mimeType: contentType, base64: Buffer.from(arrayBuf).toString('base64') };
    }
  }

  return null;
};

// POST /api/ai/analyze-food
// Analyzes food image using Google Gemini Flash or OpenAI Vision to calculate calories, macros, and serving grams
router.post('/analyze-food', upload.single('image'), async (req, res) => {
  try {
    const imageData = await resolveImageBase64(req);
    if (!imageData || !imageData.base64) {
      return res.status(400).json({ error: 'No image provided for food analysis.' });
    }

    const geminiKey =
      req.headers['x-gemini-key'] ||
      req.body?.geminiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY;

    const openaiKey =
      req.headers['x-openai-key'] ||
      req.body?.openaiKey ||
      process.env.OPENAI_API_KEY;

    // 1. Google Gemini 1.5 Flash Vision (Recommended Free Tier: 1,500 free requests/day)
    if (geminiKey && geminiKey.trim()) {
      try {
        const geminiResult = await analyzeWithGemini(imageData.base64, imageData.mimeType, geminiKey.trim());
        if (geminiResult) {
          return res.json({
            success: true,
            provider: 'gemini-1.5-flash',
            data: geminiResult,
          });
        }
      } catch (geminiErr) {
        console.error('[AI Nutrition Gemini Error]', geminiErr.message);
        // If Gemini error is invalid key, inform client
        if (geminiErr.message.includes('API_KEY_INVALID') || geminiErr.status === 400) {
          return res.status(400).json({
            success: false,
            error: 'Invalid Google Gemini API Key. Please verify your free key from Google AI Studio.',
            requiresKey: true,
          });
        }
      }
    }

    // 2. OpenAI GPT-4o-mini Vision Fallback
    if (openaiKey && openaiKey.trim()) {
      try {
        const openaiResult = await analyzeWithOpenAI(imageData.base64, imageData.mimeType, openaiKey.trim());
        if (openaiResult) {
          return res.json({
            success: true,
            provider: 'gpt-4o-mini',
            data: openaiResult,
          });
        }
      } catch (openaiErr) {
        console.error('[AI Nutrition OpenAI Error]', openaiErr.message);
      }
    }

    // 3. If no API key configured yet, return prompt for user to connect free key
    return res.status(200).json({
      success: false,
      requiresKey: true,
      error: 'Google Gemini API key required. You can get a 100% free API key from Google AI Studio in 10 seconds (no credit card required).',
      getFreeKeyUrl: 'https://aistudio.google.com/app/apikey',
    });
  } catch (err) {
    console.error('[AI Route Server Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze food image' });
  }
});

// Google Gemini Flash Vision caller
async function analyzeWithGemini(base64Image, mimeType, apiKey) {
  // Use latest flash models (gemini-flash-latest, gemini-3.8-flash) with legacy fallbacks
  const models = [
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-2.5-flash-lite',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
  ];

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const prompt = `You are a professional sports nutritionist and food identification AI.
Analyze this food/meal/snack photo carefully.
Identify the food or dish name, estimate the portion / serving size with weight in grams, total calories, and macronutrients (protein, carbs, and fat in grams).

Rules:
1. If the photo shows packaged food with a label or brand (e.g. Biskrem, Oreo, Snickers, protein bar, yogurt), read the exact brand and nutrition facts or use standard values for that exact brand.
2. If it shows a cooked or whole meal (e.g. chicken breast with rice, eggs with toast, oatmeal), estimate the serving size with weight in grams (e.g. "1 plate (350g)" or "1 bowl (200g)").
3. Estimate realistic, accurate fitness values for calories and macros.
4. Keep the food name concise and descriptive.

Return strictly valid JSON matching this exact schema:
{
  "food_name": "Name of food, snack or dish",
  "serving_size": "Serving description with grams, e.g. '1 pack (100g)' or '1 bowl (250g)'",
  "calories": 450,
  "protein_g": 25,
  "carbs_g": 50,
  "fat_g": 14,
  "description": "Short 1-sentence description of the food detected",
  "confidence": 0.95
}`;

      const payload = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType || 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2,
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini ${model}] failed with status ${res.status}: ${errText}`);
        if (errText.includes('API_KEY_INVALID') || errText.includes('API key not valid')) {
          const keyErr = new Error('API_KEY_INVALID: The provided Google Gemini API key is invalid.');
          keyErr.status = 400;
          throw keyErr;
        }
        continue;
      }

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText.trim());
      return {
        food_name: parsed.food_name || 'Detected Food Entry',
        serving_size: parsed.serving_size || '1 serving (100g)',
        calories: Number(parsed.calories) || 0,
        protein_g: Number(parsed.protein_g) || 0,
        carbs_g: Number(parsed.carbs_g) || 0,
        fat_g: Number(parsed.fat_g) || 0,
        description: parsed.description || '',
        confidence: Number(parsed.confidence) || 0.9,
      };
    } catch (e) {
      console.warn(`[Gemini ${model}] exception:`, e.message);
      if (e.message.includes('API_KEY_INVALID')) {
        throw e;
      }
    }
  }

  return null;
}

// OpenAI GPT-4o-mini Vision caller
async function analyzeWithOpenAI(base64Image, mimeType, apiKey) {
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const prompt = `You are a professional sports nutritionist and food identification AI.
Analyze this food/meal/snack photo carefully.
Identify the food or dish name, estimate the portion/serving size with weight in grams, total calories, and macronutrients (protein, carbs, and fat in grams).

Return strictly a valid JSON object matching:
{
  "food_name": "Name of food, snack or dish",
  "serving_size": "Serving description with grams, e.g. '1 pack (100g)' or '1 bowl (250g)'",
  "calories": 450,
  "protein_g": 25,
  "carbs_g": 50,
  "fat_g": 14,
  "description": "Short 1-sentence description of the food detected",
  "confidence": 0.95
}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert sports nutritionist and food scanner. Return JSON only.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI Vision failed (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const rawText = json.choices?.[0]?.message?.content;
  if (!rawText) return null;

  const parsed = JSON.parse(rawText.trim());
  return {
    food_name: parsed.food_name || 'Detected Food Entry',
    serving_size: parsed.serving_size || '1 serving (100g)',
    calories: Number(parsed.calories) || 0,
    protein_g: Number(parsed.protein_g) || 0,
    carbs_g: Number(parsed.carbs_g) || 0,
    fat_g: Number(parsed.fat_g) || 0,
    description: parsed.description || '',
    confidence: Number(parsed.confidence) || 0.9,
  };
}

export default router;
