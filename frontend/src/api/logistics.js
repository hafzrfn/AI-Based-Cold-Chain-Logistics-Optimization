import axios from 'axios';

/**
 * API service layer for communicating with the Flask backend.
 * All API calls are centralized here for maintainability.
 */

// Conditionally use local backend if running locally
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://ai-based-cold-chain-logistics-optim-virid.vercel.app';

// Create a reusable axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

/**
 * Calculate logistics for selected foods and route.
 * @param {string[]} selectedFoodIds - Array of food IDs
 * @param {Array<{ lat: number, lng: number, name: string }>} waypoints - Array of locations
 * @param {number|null} drivingDistanceKm - Actual driving distance from OSRM
 * @returns {Promise<object>} Logistics calculation results
 */
export const calculateLogistics = async (selectedFoodIds, waypoints, drivingDistanceKm = null) => {
  const response = await apiClient.post('/api/calculate', {
    foods: selectedFoodIds,
    waypoints: waypoints.map(wp => ({
      lat: wp.lat,
      lng: wp.lng,
      name: wp.name || 'Unknown',
    })),
    drivingDistanceKm,
  });
  return response.data;
};

/**
 * Fetch food catalog from the backend.
 * @returns {Promise<object[]>} Array of food items
 */
export const fetchFoods = async () => {
  const response = await apiClient.get('/api/foods');
  return response.data;
};

/**
 * Health check for the backend.
 * @returns {Promise<object>} Health status
 */
export const healthCheck = async () => {
  const response = await apiClient.get('/api/health');
  return response.data;
};
