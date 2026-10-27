import { getAuthToken } from '../lib/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper: Convert File to Base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = typeof result === 'string' && result.includes(',') ? result.split(',')[1] : result;
      resolve({
        base64,
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper: Convert Remote Image URL or Blob to Base64
export const imageUrlToBase64 = async (url) => {
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], base64: match[2] };
    }
  }
  const res = await fetch(url);
  const blob = await res.blob();
  return fileToBase64(blob);
};

// Direct client-side Gemini fallback
export const callGeminiDirect = async ({ base64, mimeType, apiKey }) => {
  const models = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];

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

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType || 'image/jpeg',
                  data: base64,
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

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errText = await res.text();
        if (errText.includes('API_KEY_INVALID') || errText.includes('API key not valid')) {
          return {
            success: false,
            requiresKey: true,
            error: 'Invalid Google Gemini API Key. Please verify your free key from Google AI Studio.',
          };
        }
        continue;
      }

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const cleanJson = rawText
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      const parsed = JSON.parse(cleanJson);
      return {
        success: true,
        provider: model,
        data: {
          food_name: parsed.food_name || 'Detected Food Entry',
          serving_size: parsed.serving_size || '1 serving (100g)',
          calories: Number(parsed.calories) || 0,
          protein_g: Number(parsed.protein_g) || 0,
          carbs_g: Number(parsed.carbs_g) || 0,
          fat_g: Number(parsed.fat_g) || 0,
          description: parsed.description || '',
          confidence: Number(parsed.confidence) || 0.9,
        },
      };
    } catch (err) {
      console.warn(`[Client Gemini ${model}] failed:`, err.message);
    }
  }

  return null;
};

export const aiService = {
  getGeminiKey() {
    return (
      localStorage.getItem('fittrack_gemini_key') ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      ''
    );
  },

  setGeminiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem('fittrack_gemini_key', key.trim());
    } else {
      localStorage.removeItem('fittrack_gemini_key');
    }
  },

  getOpenAIKey() {
    return (
      localStorage.getItem('fittrack_openai_key') ||
      import.meta.env.VITE_OPENAI_API_KEY ||
      ''
    );
  },

  setOpenAIKey(key) {
    if (key && key.trim()) {
      localStorage.setItem('fittrack_openai_key', key.trim());
    } else {
      localStorage.removeItem('fittrack_openai_key');
    }
  },

  async analyzeFoodImage({ file, imageUrl, imageBase64, customKey }) {
    const token = getAuthToken();
    const activeGeminiKey = customKey || this.getGeminiKey();
    const activeOpenAIKey = this.getOpenAIKey();

    // 1. First attempt: Use Backend API
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (activeGeminiKey) headers['x-gemini-key'] = activeGeminiKey;
      if (activeOpenAIKey) headers['x-openai-key'] = activeOpenAIKey;

      let response;
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        if (activeGeminiKey) formData.append('geminiKey', activeGeminiKey);

        response = await fetch(`${API_BASE_URL}/ai/analyze-food`, {
          method: 'POST',
          headers,
          body: formData,
        });
      } else {
        response = await fetch(`${API_BASE_URL}/ai/analyze-food`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify({
            imageUrl,
            imageBase64,
            geminiKey: activeGeminiKey,
          }),
        });
      }

      if (response && response.ok) {
        const data = await response.json();
        // If server successfully analyzed food, or explicitly says key is invalid:
        if (data && data.success) {
          return data;
        }
        if (data && data.requiresKey && !activeGeminiKey) {
          return data;
        }
      }
    } catch (serverErr) {
      console.warn('[AI Service Backend Route Unavailable, Falling back to direct Gemini call]:', serverErr.message);
    }

    // 2. Client-side direct Gemini fallback (bypasses serverless timeout/offline backend)
    if (activeGeminiKey && activeGeminiKey.trim()) {
      try {
        let imgData = null;
        if (imageBase64) {
          imgData = {
            base64: imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64,
            mimeType: 'image/jpeg',
          };
        } else if (file) {
          imgData = await fileToBase64(file);
        } else if (imageUrl) {
          imgData = await imageUrlToBase64(imageUrl);
        }

        if (imgData && imgData.base64) {
          const directResult = await callGeminiDirect({
            base64: imgData.base64,
            mimeType: imgData.mimeType,
            apiKey: activeGeminiKey.trim(),
          });

          if (directResult) {
            return directResult;
          }
        }
      } catch (clientErr) {
        console.error('[AI Service Direct Gemini Fallback Error]', clientErr);
      }
    }

    // 3. If no key configured anywhere:
    if (!activeGeminiKey && !activeOpenAIKey) {
      return {
        success: false,
        requiresKey: true,
        error: 'Google Gemini API key required. You can get a 100% free API key from Google AI Studio in 10 seconds.',
        getFreeKeyUrl: 'https://aistudio.google.com/app/apikey',
      };
    }

    return {
      success: false,
      error: 'AI could not recognize food in this photo. You can enter macros manually.',
    };
  },
};
