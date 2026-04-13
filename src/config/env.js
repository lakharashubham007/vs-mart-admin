/**
 * Centralized environment configuration.
 * Variables are set in the .env file at the admin project root.
 */

// Dynamic detection for network-based IP access
const getHostname = () => {
    if (typeof window === 'undefined') return 'localhost';
    return window.location.hostname;
};

export const BASE_URL = import.meta.env.VITE_BASE_URL || `http://${getHostname()}:5000/v1`;
export const BASE_IMAGE_URL = import.meta.env.VITE_BASE_IMAGE_URL || `http://${getHostname()}:5000`;
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""; 
