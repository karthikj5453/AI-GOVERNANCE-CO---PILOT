const axios = require('axios');
const logger = require('../src/modules/utils/logger');

class FastAPIClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
      timeout: parseInt(process.env.AI_SERVICE_TIMEOUT) || 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.client.interceptors.response.use(
      response => response.data,
      error => {
        logger.error('FastAPI client error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || 'AI service error');
      }
    );
  }

  async runSimulation(data) {
    return this.client.post('/api/v1/simulate', data);
  }

  async analyzePolicy(data) {
    return this.client.post('/api/v1/analyze/policy', data);
  }

  async generateSpeech(data) {
    return this.client.post('/api/v1/generate/speech', data);
  }

  async simulateDebate(data) {
    return this.client.post('/api/v1/simulate/debate', data);
  }

  async analyzeSentiment(data) {
    return this.client.post('/api/v1/analyze/sentiment', data);
  }

  async getRegulations(params) {
    return this.client.get('/api/v1/regulations', { params });
  }

  async checkHealth() {
    return this.client.get('/health');
  }
}

module.exports = new FastAPIClient();
