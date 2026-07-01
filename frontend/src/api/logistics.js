import axios from 'axios';

/**
 * API service layer for communicating with the Flask backend.
 * All API calls are centralized here for maintainability.
 */

// Base URL for the backend API
const API_BASE_URL = 'https://coldchain-backend.onrender.com/api';

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
 * @param {{ lat: number, lng: number, name: string }} origin - Origin location
 * @param {{ lat: number, lng: number, name: string }} destination - Destination location
 * @returns {Promise<object>} Logistics calculation results
 */
export const calculateLogistics = async (selectedFoodIds, origin, destination) => {
  const response = await apiClient.post('/calculate', {
    foods: selectedFoodIds,
    origin: {
      lat: origin.lat,
      lng: origin.lng,
      name: origin.name || 'Unknown',
    },
    destination: {
      lat: destination.lat,
      lng: destination.lng,
      name: destination.name || 'Unknown',
    },
  });
  return response.data;
};

/**
 * Fetch food catalog from the backend.
 * @returns {Promise<object[]>} Array of food items
 */
export const fetchFoods = async () => {
  const response = await apiClient.get('/foods');
  return response.data;
};

/**
 * Health check for the backend.
 * @returns {Promise<object>} Health status
 */
export const healthCheck = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};
