import { api } from '../lib/api';

export const storageService = {
  async uploadUserImage(_userId, file, folder = 'gym') {
    try {
      const data = await api.upload(file, { category: folder });
      return { url: data.url, error: null };
    } catch (err) {
      // Local fallback for offline/preview environments: convert to DataURL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({ url: reader.result, error: null });
        };
        reader.onerror = () => {
          resolve({ url: null, error: new Error('Failed to read image file locally') });
        };
        reader.readAsDataURL(file);
      });
    }
  },
};
