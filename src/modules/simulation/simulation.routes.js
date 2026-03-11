const express = require('express');
const { body, query, param } = require('express-validator');
const simulationController = require('./simulation.controller');
const { authMiddleware } = require('../../../middlewares/auth.middleware');

const router = express.Router();
router.use(authMiddleware);

router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').isIn(['policy', 'speech', 'debate', 'crisis', 'public_reaction']),
  body('parameters').isObject().withMessage('Parameters are required')
], simulationController.createSimulation);

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('type').optional().isIn(['policy', 'speech', 'debate', 'crisis', 'public_reaction']),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed'])
], simulationController.getUserSimulations);

router.get('/stats', simulationController.getSimulationStats);
router.get('/:id', [param('id').isMongoId().withMessage('Invalid simulation ID')], simulationController.getSimulationById);
router.patch('/:id', [param('id').isMongoId()], simulationController.updateSimulation);
router.delete('/:id', [param('id').isMongoId()], simulationController.deleteSimulation);
router.post('/:id/archive', [param('id').isMongoId()], simulationController.archiveSimulation);

module.exports = router;
