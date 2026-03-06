import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api'; // Your backend API base URL

const scenarioService = {
  // Fetches all scenarios for the authenticated user
  getScenarios: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/scenarios`);
      return response.data;
    } catch (error) {
      console.error('Error fetching scenarios:', error.response?.data || error.message);
      throw error; // Re-throw to be handled by the component
    }
  },

  // Fetches a single scenario by its ID
  getScenarioById: async (scenarioId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/scenarios/${scenarioId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching scenario ${scenarioId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Creates a new scenario
  createScenario: async (scenarioData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/scenarios`, scenarioData);
      return response.data;
    } catch (error) {
      console.error('Error creating scenario:', error.response?.data || error.message);
      throw error;
    }
  },

  // Updates an existing scenario
  updateScenario: async (scenarioId, scenarioData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/scenarios/${scenarioId}`, scenarioData);
      return response.data;
    } catch (error) {
      console.error(`Error updating scenario ${scenarioId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Deletes a scenario
  deleteScenario: async (scenarioId) => {
    try {
      await axios.delete(`${API_BASE_URL}/scenarios/${scenarioId}`);
      return true; // Indicate success
    } catch (error) {
      console.error(`Error deleting scenario ${scenarioId}:`, error.response?.data || error.message);
      throw error;
    }
  },
};

export default scenarioService;