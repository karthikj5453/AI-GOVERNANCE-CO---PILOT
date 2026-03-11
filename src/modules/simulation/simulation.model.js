const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['policy', 'speech', 'debate', 'crisis', 'public_reaction'],
    required: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parameters: { type: Object },
  input: { type: Object },
  output: { type: Object },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  archived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Simulation', simulationSchema);
