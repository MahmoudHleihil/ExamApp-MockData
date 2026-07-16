// Configuration to toggle between mock data and server API
// Uses Vite environment variables for security and environment flexibility
export const API_CONFIG = {
  useMock: import.meta.env.VITE_USE_MOCK === 'true', 
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
};

// Helper to get fetch configuration with auth headers and credentials for cookies
export const getFetchConfig = (method = 'GET', body = null) => {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include' // Important for HttpOnly cookies
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  return config;
};

// Legacy helper (still used in some places)
export const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};
