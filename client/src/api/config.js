// Configuration to toggle between mock data and server API
// Set useMock to true to use local mockDb.js
// Set useMock to false to use the Express server API
export const API_CONFIG = {
  useMock: false, // Default to mock for now
  baseUrl: 'http://localhost:5000/api'
};
