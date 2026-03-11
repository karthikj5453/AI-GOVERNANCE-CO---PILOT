const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refreshToken: { type: String, required: true },
  deviceInfo: { type: Object, default: {} },
  ipAddress: String,
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

authSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Auth', authSchema);
