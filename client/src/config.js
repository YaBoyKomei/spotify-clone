// API Configuration
// Always use Render server for API calls

// API Base URL - always use Render
export const API_BASE_URL = 'https://sonfy.onrender.com';

// Helper function to build API URLs
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

console.log('🔧 API Config:', {
  API_BASE_URL,
  hostname: window.location.hostname
});
