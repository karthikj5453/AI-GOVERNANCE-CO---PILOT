const aiClient = require('../../../integration/fastapi.clients');
const Simulation = require('../simulation/simulation.model');
const logger = require('../utils/logger');

class AIService {
  async analyzePolicy(data, userId) {
    try {
      const response = await aiClient.analyzePolicy(data);
      await Simulation.create({
        title: `Policy Analysis: ${data.topic}`,
        type: 'policy',
        createdBy: userId,
        parameters: data,
        input: { text: data.policyText },
        output: response,
        status: 'completed'
      });
      return response;
    } catch (error) {
      logger.error('Policy analysis error:', error);
      throw error;
    }
  }

  async generateSpeech(data, userId) {
    try {
      const response = await aiClient.generateSpeech(data);
      await Simulation.create({
        title: `Speech: ${data.topic}`,
        type: 'speech',
        createdBy: userId,
        parameters: data,
        output: response,
        status: 'completed'
      });
      return response;
    } catch (error) {
      logger.error('Speech generation error:', error);
      throw error;
    }
  }

  async simulateDebate(data, userId) {
    try {
      const response = await aiClient.simulateDebate(data);
      await Simulation.create({
        title: `Debate: ${data.topic}`,
        type: 'debate',
        createdBy: userId,
        parameters: data,
        output: response,
        status: 'completed'
      });
      return response;
    } catch (error) {
      logger.error('Debate error:', error);
      throw error;
    }
  }

  async analyzePublicSentiment(data, userId) {
    try {
      const response = await aiClient.analyzeSentiment(data);
      await Simulation.create({
        title: `Sentiment: ${data.topic || data.text?.substring(0, 30) || 'Analysis'}`,
        type: 'public_reaction',
        createdBy: userId,
        parameters: data,
        output: response,
        status: 'completed'
      });
      return response;
    } catch (error) {
      logger.error('Sentiment error:', error);
      throw error;
    }
  }

  async getAIRegulations(query) {
    try {
      return await aiClient.getRegulations(query);
    } catch (error) {
      logger.error('Regulations fetch error:', error);
      throw error;
    }
  }
}

module.exports = new AIService();
