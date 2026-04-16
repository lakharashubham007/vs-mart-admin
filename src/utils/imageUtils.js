import { BASE_IMAGE_URL } from '../config/env';

/**
 * Resolves an image path to a full URL.
 * Handles both relative local paths and absolute Cloudinary URLs.
 * 
 * @param {string} path - The image path or absolute URL
 * @returns {string} - The resolved full URL
 */
export const resolveImageUrl = (path) => {
    if (!path) return '';
    
    // If it's already an absolute URL (starts with http), return it as is
    if (path.startsWith('http')) {
        return path;
    }

    // Otherwise, prefix it with the backend image server URL
    const base = (BASE_IMAGE_URL || '').replace(/\/$/, '');
    const relativePath = path.replace(/^\//, '');
    
    return `${base}/${relativePath}`;
};
