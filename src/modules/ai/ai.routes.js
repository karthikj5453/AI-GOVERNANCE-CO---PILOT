const express = require('express');
const { body } = require('express-validator');
const aiController = require('./ai.controller');
const { authMiddleware } = require('../../../middlewares/auth.middleware');

const router = express.Router();
router.use(authMiddleware);

router.post('/analyze-policy', [
  body('policyText').notEmpty().withMessage('Policy text is required'),
  body('topic').notEmpty().withMessage('Topic is required')
], aiController.analyzePolicy);

router.post('/generate-speech', [
  body('topic').notEmpty().withMessage('Topic is required'),
  body('audience').notEmpty().withMessage('Audience is required'),
  body('keyPoints').isArray().withMessage('Key points must be an array')
], aiController.generateSpeech);

router.post('/simulate-debate', [
  body('topic').notEmpty().withMessage('Topic is required'),
  body('opponent').notEmpty().withMessage('Opponent stance is required')
], aiController.simulateDebate);

router.post('/analyze-sentiment', [
  body('text').notEmpty().withMessage('Text to analyze is required'),
  body('context').optional().isString()
], aiController.analyzePublicSentiment);

router.get('/regulations', aiController.getAIRegulations);

module.exports = router;
