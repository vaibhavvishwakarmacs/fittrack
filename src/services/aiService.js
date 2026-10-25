import { getAuthToken } from '../lib/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const aiService = {
  getGeminiKey() {
    return localStorage.getItem('fittrack_gemini_key') || '';
  },

  setGeminiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem('fittrack_gemini_key', key.trim());
    } else {
      localStorage.removeItem('fittrack_gemini_key');
    }
  },

  getOpenAIKey() {
    return localStorage.getItem('fittrack_openai_key') || '';
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

    const data = await response.json();
    return data;
  },
};
