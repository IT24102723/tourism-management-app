import { IMAGE_BASE_URL } from '../config/env';

const API_STATIC_BASE = IMAGE_BASE_URL; // Standardized server URL

export const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  
  // Normalize Windows paths (uploads\file.jpg) -> (uploads/file.jpg)
  const normalized = String(url).replace(/\\/g, '/');

  // Ensure we have a leading slash for relative paths
  const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
  
  // If it's a relative path (contains slash or is likely an upload), prepend base
  if (cleanPath.includes('/') || cleanPath.includes('\\')) {
    // Avoid accidental double slashes between host and path
    return `${API_STATIC_BASE}`.replace(/\/+$/, '') + cleanPath;
  }
  
  return url;
};

export const getPrimaryImage = (item) => {
  if (!item) return null;
  
  let rawUrl = null;
  if (item.image_url) {
    rawUrl = item.image_url;
  } else if (item.images) {
    if (typeof item.images === 'string') {
      rawUrl = item.images.split(',')[0];
    } else if (Array.isArray(item.images) && item.images.length > 0) {
      const first = item.images[0];
      rawUrl = typeof first === 'string' ? first : (first.url || first.image_url);
    }
  } else if (item.primary_image) {
    rawUrl = item.primary_image;
  }
  
  return resolveImageUrl(rawUrl);
};
