import { getAuthToken } from '../lib/api';
import { compressImage } from '../lib/imageCompressor';

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
export const callGeminiDirect = async ({ base64, mimeType, apiKey, userNotes = '' }) => {
  const models = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];

  const userNotesDirective = userNotes
    ? `\n\nCRITICAL - USER-PROVIDED MEAL DETAILS & CONTEXT:
The user explicitly provided these notes/details about the meal:
"${userNotes}"

MANDATORY INSTRUCTIONS FOR USER NOTES:
1. Heavily prioritize and strictly integrate the user's notes into food identification, portion sizing, ingredients, and cooking/prep methods.
2. If the user mentions cooking fats or oils (e.g. olive oil, butter, ghee, coconut oil), calculate and include those extra calories and fat grams (e.g. 1 tbsp olive oil adds ~120 kcal, 14g fat).
3. If the user specifies portion weights or quantities (e.g. "200g chicken breast", "2 rotis/chapatis", "2 scoops whey", "1.5 cups rice"), compute the nutrition values directly based on these stated quantities rather than a rough visual guess.
4. If the user notes hidden ingredients, milk type (e.g. whole milk, oat milk), or brand names, adjust the macros accurately for those items.
5. In the "description" field, provide a comprehensive, 1-2 sentence description explaining the dish and explicitly stating how the user's custom details and ingredients were factored into the macros.`
    : `\n\nProvide an accurate, detailed breakdown based on visual cues and standard sports nutrition portion sizes. In the "description" field, give a helpful 1-sentence description of the dish detected.`;

  const prompt = `You are an expert sports nutritionist, registered dietitian, and food recognition AI.
Analyze this food/meal/snack photo carefully.
Identify the food or dish name, estimate the portion / serving size with weight in grams, total calories, and macronutrients (protein, carbs, and fat in grams).${userNotesDirective}

Rules:
1. If the photo shows packaged food with a label or brand (e.g. Biskrem, Oreo, Snickers, protein bar, yogurt), read the exact brand and nutrition facts or use standard values for that exact brand.
2. If it shows a cooked or whole meal (e.g. chicken breast with rice, eggs with toast, oatmeal), estimate realistic, accurate fitness values for calories and macros.
3. Keep the food name concise and descriptive.

Return strictly valid JSON matching this exact schema:
{
  "food_name": "Name of food, snack or dish",
  "serving_size": "Serving description with grams, e.g. '1 pack (100g)' or '1 bowl (250g)'",
  "calories": 450,
  "protein_g": 25,
  "carbs_g": 50,
  "fat_g": 14,
  "description": "Detailed 1-2 sentence description explaining the food and how ingredients/notes were factored in",
  "confidence": 0.95
}`;

  for (const model of models) {
    try {
      console.log(`[AI Client Gemini Direct] Trying model: ${model}...`);
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
      const timer = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      console.log(`[AI Client Gemini Direct] Model ${model} returned HTTP ${res.status}`);

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[AI Client Gemini Direct] Model ${model} error:`, errText.slice(0, 200));
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
      console.log(`[AI Client Gemini Direct] Successfully parsed:`, parsed.food_name);
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
          notes_factored: Boolean(userNotes),
        },
      };
    } catch (err) {
      console.warn(`[AI Client Gemini Direct] Model ${model} failed:`, err.message);
    }
  }

  return null;
};

export const aiService = {
  getGeminiKey() {
    let key =
      localStorage.getItem('fittrack_gemini_key') ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      '';
    if (key) {
      key = key.trim().replace(/^(GEMINI_API_KEY|VITE_GEMINI_API_KEY)\s*=\s*/i, '').replace(/^["']|["']$/g, '').trim();
      // If it ends with ellipsis or is too short (< 35 chars), it is truncated/invalid
      if (key.endsWith('...') || (key.length > 0 && key.length < 35)) {
        console.warn('[AI Client] Discarding truncated Gemini key:', key.slice(0, 10));
        return '';
      }
    }
    return key;
  },

  setGeminiKey(key) {
    if (key && typeof key === 'string') {
      let clean = key.trim().replace(/^(GEMINI_API_KEY|VITE_GEMINI_API_KEY)\s*=\s*/i, '').replace(/^["']|["']$/g, '').trim();
      if (clean) {
        localStorage.setItem('fittrack_gemini_key', clean);
        return;
      }
    }
    localStorage.removeItem('fittrack_gemini_key');
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

  async analyzeFoodImage({ file, imageUrl, imageBase64, customKey, userNotes = '' }) {
    const token = getAuthToken();
    const activeGeminiKey = customKey || this.getGeminiKey();
    const activeOpenAIKey = this.getOpenAIKey();

    // Automatically optimize / compress image file to stay well within limits (< 200KB)
    let optimizedFile = file;
    if (file instanceof Blob) {
      try {
        optimizedFile = await compressImage(file, 1200, 0.8);
        console.log(`[AI Client] Image compressed: ${(file.size / 1024).toFixed(0)}KB -> ${(optimizedFile.size / 1024).toFixed(0)}KB`);
      } catch (cErr) {
        console.warn('[AI Client] Image compression skipped:', cErr.message);
        optimizedFile = file;
      }
    }

    console.log('[AI Client] analyzeFoodImage called, hasGeminiKey:', Boolean(activeGeminiKey), 'userNotesLength:', userNotes?.length || 0);

    // 1. First attempt: Use Backend API
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (activeGeminiKey) headers['x-gemini-key'] = activeGeminiKey;
      if (activeOpenAIKey) headers['x-openai-key'] = activeOpenAIKey;

      let response;
      if (optimizedFile) {
        const formData = new FormData();
        formData.append('image', optimizedFile);
        if (activeGeminiKey) formData.append('geminiKey', activeGeminiKey);
        if (userNotes && userNotes.trim()) {
          formData.append('userNotes', userNotes.trim());
        }

        console.log('[AI Client] Sending multipart image with notes to backend...');
        response = await fetch(`${API_BASE_URL}/ai/analyze-food`, {
          method: 'POST',
          headers,
          body: formData,
        });
      } else {
        console.log('[AI Client] Sending JSON image URL/base64 with notes to backend...');
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
            userNotes: userNotes && userNotes.trim() ? userNotes.trim() : undefined,
          }),
        });
      }

      console.log('[AI Client] Backend responded with HTTP status:', response.status);

      if (response && response.ok) {
        const data = await response.json();
        console.log('[AI Client] Backend response data:', data);
        if (data && data.success) {
          return data;
        }
        if (data && data.requiresKey && !activeGeminiKey) {
          return data;
        }
      } else if (response) {
        const errText = await response.text();
        console.warn(`[AI Client] Backend HTTP ${response.status} error:`, errText.slice(0, 300));
      }
    } catch (serverErr) {
      console.warn('[AI Client] Backend request threw error:', serverErr.message);
    }

    // 2. Client-side direct Gemini fallback (bypasses serverless limits / cold-starts)
    if (activeGeminiKey && activeGeminiKey.trim()) {
      try {
        console.log('[AI Client] Initiating client direct Gemini fallback with user notes...');
        let imgData = null;
        if (imageBase64) {
          imgData = {
            base64: imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64,
            mimeType: 'image/jpeg',
          };
        } else if (optimizedFile) {
          imgData = await fileToBase64(optimizedFile);
        } else if (imageUrl) {
          imgData = await imageUrlToBase64(imageUrl);
        }

        if (imgData && imgData.base64) {
          const directResult = await callGeminiDirect({
            base64: imgData.base64,
            mimeType: imgData.mimeType,
            apiKey: activeGeminiKey.trim(),
            userNotes: userNotes && userNotes.trim() ? userNotes.trim() : '',
          });

          if (directResult) {
            console.log('[AI Client] Direct Gemini fallback succeeded!');
            return directResult;
          }
        }
      } catch (clientErr) {
        console.error('[AI Client Direct Gemini Error]:', clientErr);
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
