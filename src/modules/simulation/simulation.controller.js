const simulationService = require('./simulation.service');
const { validationResult } = require('express-validator');

class SimulationController {
  async createSimulation(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const simulation = await simulationService.createSimulation(req.user._id, req.body);
      res.status(201).json({ message: 'Simulation created', simulation });
    } catch (error) {
      next(error);
    }
  }

  async getUserSimulations(req, res, next) {
    try {
      const result = await simulationService.getUserSimulations(req.user._id, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getSimulationById(req, res, next) {
    try {
      const simulation = await simulationService.getSimulationById(req.params.id, req.user._id);
      res.json({ simulation });
    } catch (error) {
      next(error);
    }
  }

  async updateSimulation(req, res, next) {
    try {
      const simulation = await simulationService.updateSimulation(req.params.id, req.user._id, req.body);
      res.json({ message: 'Updated', simulation });
    } catch (error) {
      next(error);
    }
  }

  async deleteSimulation(req, res, next) {
    try {
      const result = await simulationService.deleteSimulation(req.params.id, req.user._id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async archiveSimulation(req, res, next) {
    try {
      const simulation = await simulationService.archiveSimulation(req.params.id, req.user._id);
      res.json({ message: 'Archived', simulation });
    } catch (error) {
      next(error);
    }
  }

  async getSimulationStats(req, res, next) {
    try {
      const stats = await simulationService.getSimulationStats(req.user._id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SimulationController();
