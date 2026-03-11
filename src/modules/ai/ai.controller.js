const aiService = require('./ai.service');
const { validationResult } = require('express-validator');

class AIController {
  async analyzePolicy(req, res, next) {
    try {
      const result = await aiService.analyzePolicy(req.body, req.user._id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async generateSpeech(req, res, next) {
    try {
      const result = await aiService.generateSpeech(req.body, req.user._id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async simulateDebate(req, res, next) {
    try {
      const result = await aiService.simulateDebate(req.body, req.user._id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async analyzePublicSentiment(req, res, next) {
    try {
      const result = await aiService.analyzePublicSentiment(req.body, req.user._id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAIRegulations(req, res, next) {
    try {
      const result = await aiService.getAIRegulations(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AIController();
