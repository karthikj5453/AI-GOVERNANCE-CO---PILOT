const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../user/user.model');
const Auth = require('./auth.model');
const logger = require('../utils/logger');

class AuthService {
  async register(userData) {
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }]
    });
    if (existingUser) throw new Error('User already exists');

    const user = new User(userData);
    await user.save();
    const tokens = await this.generateTokens(user);
    return { user, tokens };
  }

  async login(email, password, deviceInfo = {}, ipAddress = '') {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new Error('Invalid credentials');
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new Error('Invalid credentials');

    const tokens = await this.generateTokens(user, deviceInfo, ipAddress);
    return { user, tokens };
  }

  async generateTokens(user, deviceInfo = {}, ipAddress = '') {
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await Auth.create({
      userId: user._id,
      refreshToken,
      deviceInfo,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken) {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const authRecord = await Auth.findOne({ refreshToken, userId: decoded.userId });
    if (!authRecord) throw new Error('Invalid refresh token');
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error('User not found');
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    return { accessToken };
  }

  async logout(refreshToken) {
    await Auth.deleteOne({ refreshToken });
  }
}

module.exports = new AuthService();
