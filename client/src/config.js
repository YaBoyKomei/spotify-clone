// API Configuration
// Detects if running in Capacitor (native app) or browser

import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

// API Base URL
export const API_BASE_URL = isNative 
  ? 'https://sonfy.onrender.com'  // Production server for native app
  : '';  // Relative URL for web (uses same origin)

// Helper function to build API URLs
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

console.log('🔧 API Config:', {
  isNative,
  API_BASE_URL,
  platform: Capacitor.getPlatform()
});
