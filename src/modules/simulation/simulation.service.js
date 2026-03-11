const Simulation = require('./simulation.model');
const aiClient = require('../../../integration/fastapi.clients');
const logger = require('../utils/logger');

class SimulationService {
  async createSimulation(userId, simulationData) {
    const simulation = new Simulation({
      ...simulationData,
      createdBy: userId,
      status: 'pending'
    });
    await simulation.save();
    this.processWithAI(simulation._id).catch(err => logger.error('AI processing error:', err));
    return simulation;
  }

  async processWithAI(simulationId) {
    try {
      const simulation = await Simulation.findById(simulationId);
      if (!simulation || simulation.status !== 'pending') return;

      await Simulation.findByIdAndUpdate(simulationId, { status: 'processing' });

      const response = await aiClient.runSimulation({
        type: simulation.type,
        parameters: simulation.parameters
      });

      await Simulation.findByIdAndUpdate(simulationId, {
        output: response,
        status: 'completed'
      });
    } catch (error) {
      logger.error('Process AI error:', error);
      await Simulation.findByIdAndUpdate(simulationId, {
        status: 'failed',
        output: { error: error.message }
      });
    }
  }

  async getUserSimulations(userId, query) {
    const { page = 1, limit = 10, type, status } = query;
    const filter = { createdBy: userId, archived: { $ne: true } };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const [simulations, total] = await Promise.all([
      Simulation.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)).populate('createdBy', 'name email'),
      Simulation.countDocuments(filter)
    ]);
    return { simulations, total, page: parseInt(page), pages: Math.ceil(total / limit) };
  }

  async getSimulationById(id, userId) {
    const simulation = await Simulation.findOne({ _id: id, createdBy: userId });
    if (!simulation) throw new Error('Simulation not found');
    return simulation;
  }

  async updateSimulation(id, userId, updates) {
    const simulation = await Simulation.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { $set: updates },
      { new: true }
    );
    if (!simulation) throw new Error('Simulation not found');
    return simulation;
  }

  async deleteSimulation(id, userId) {
    const result = await Simulation.deleteOne({ _id: id, createdBy: userId });
    if (result.deletedCount === 0) throw new Error('Simulation not found');
    return { message: 'Simulation deleted' };
  }

  async archiveSimulation(id, userId) {
    const simulation = await Simulation.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { archived: true },
      { new: true }
    );
    if (!simulation) throw new Error('Simulation not found');
    return simulation;
  }

  async getSimulationStats(userId) {
    const stats = await Simulation.aggregate([
      { $match: { createdBy: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    return stats.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});
  }
}

module.exports = new SimulationService();
