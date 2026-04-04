/**
 * Centralized environment configuration.
 * Variables are set in the .env file at the admin project root.
 */

export const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000/v1';
export const BASE_IMAGE_URL = import.meta.env.VITE_BASE_IMAGE_URL || 'http://localhost:5000';
