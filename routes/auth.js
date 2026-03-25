const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { getConnectionStatus } = require('../config/db');

function generateToken(userId) {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '7d' });
}

// Middleware: check MongoDB is connected
function requireDB(req, res, next) {
  if (!getConnectionStatus()) {
    return res.status(503).json({
      success: false,
      error: 'Database is not connected. Please ensure MongoDB is running and try again.',
    });
  }
  next();
}

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Validate password strength
function validatePassword(password) {
  const errors = [];
  if (password.length < 7) errors.push('at least 7 characters');
  if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('one digit');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) errors.push('one special character');
  return errors;
}

// POST /api/auth/register
router.post('/register', requireDB, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    // Validate name
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({ success: false, error: 'Name must be at least 2 characters.' });
    }
    if (trimmedName.length > 50) {
      return res.status(400).json({ success: false, error: 'Name cannot exceed 50 characters.' });
    }

    // Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    // Validate password
    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Password must contain: ${pwErrors.join(', ')}.`,
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered.' });
    }

    const user = await User.create({ name: trimmedName, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, error: msg });
    }
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', requireDB, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

// GET /api/auth/me  (requires token)
router.get('/me', requireDB, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
});

module.exports = router;
