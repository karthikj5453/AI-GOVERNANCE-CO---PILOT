const authService = require('./auth.service');
const { validationResult } = require('express-validator');

class AuthController {
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { user, tokens } = await authService.register(req.body);
      res.status(201).json({
        message: 'Registration successful',
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        tokens
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { user, tokens } = await authService.login(
        req.body.email,
        req.body.password,
        req.headers['user-agent'],
        req.ip
      );
      res.json({
        message: 'Login successful',
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        tokens
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
      const { accessToken } = await authService.refreshAccessToken(refreshToken);
      res.json({ accessToken });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      if (req.body.refreshToken) await authService.logout(req.body.refreshToken);
      res.json({ message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
