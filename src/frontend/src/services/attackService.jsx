import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api'; // Your backend API base URL

const attackService = {
  /**
   * Launches a simulated attack on a specified scenario.
   * @param {Object} attackRequest - The request body for launching an attack,
   * matching the backend's AttackLaunchRequest model.
   * Example: { scenario_id: "...", attack_config: { attack_type: "port_scan", ... } }
   * @returns {Object} The response data, typically an AttackStatusResponse.
   */
  launchAttack: async (attackRequest) => {
    try {
      // The backend expects `scenario_id` and `attack_config` as top-level keys.
      // `attack_config` will automatically be parsed by Pydantic's discriminator.
      const response = await axios.post(`${API_BASE_URL}/attacks/launch`, attackRequest);
      return response.data;
    } catch (error) {
      console.error('Error launching attack:', error.response?.data || error.message);
      // Re-throw the error so components can handle it (e.g., display error message)
      throw error.response?.data?.detail || 'Failed to launch attack. Please try again.';
    }
  },
  getAttackHistory: async () => {
    const res = await axios.get(`${API_BASE_URL}/attacks`);
    return res.data;
  }
};


export default attackService;