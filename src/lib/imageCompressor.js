/**
 * Compresses and resizes an image File or Blob for fast mobile uploads and AI processing.
 * Reduces 10MB+ camera photos down to ~100-200KB to stay well under Vercel (4.5MB)
 * and Google Gemini inline_data (4MB) limits, while preserving nutrition text clarity.
 */
export async function compressImage(file, maxDimension = 1200, quality = 0.8) {
  if (!file || !(file instanceof Blob)) return file;
  if (!file.type || !file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    // If it is already very small (< 250KB JPEG/WEBP), no need to re-encode
    if (file.size < 250 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
      resolve(file);
      return;
    }

    // Check if we are in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (!width || !height) {
        resolve(file);
        return;
      }

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const outputName = (file.name || 'food-photo.jpg').replace(/\.[^/.]+$/, '') + '.jpg';
          const compressedFile = new File([blob], outputName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
