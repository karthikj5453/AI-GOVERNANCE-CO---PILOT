const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['politician', 'staff', 'admin'],
    default: 'politician'
  },
  profile: {
    avatar: String,
    bio: String,
    constituency: String,
    party: String,
    position: String
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  },
  isActive: { type: Boolean, default: true },
  lastLogin: Date
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
