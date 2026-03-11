const express = require('express');
const { body } = require('express-validator');
const authController = require('./auth.controller');
const { authMiddleware } = require('../../../middlewares/auth.middleware');

const router = express.Router();

router.get('/login', (req, res) => {
  res.json({ ok: true, message: 'Auth API ready' });
});

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['politician', 'staff', 'admin'])
], authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], authController.login);

router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
