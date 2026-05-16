import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const api = {
  checkHealth: async () => {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  },
  getCities: async () => {
    const response = await axios.get(`${API_URL}/cities`);
    return response.data;
  },
  getLocations: async (city) => {
    const response = await axios.get(`${API_URL}/locations/${city}`);
    return response.data;
  },
  predictItinerary: async (data) => {
    const response = await axios.post(`${API_URL}/predict`, data);
    return response.data;
  }
};
