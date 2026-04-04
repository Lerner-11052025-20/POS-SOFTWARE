const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateToken();

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  const safeUser = user.toSafeObject();

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: safeUser,
    });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post(
  '/signup',
  [
    body('fullName')
      .trim()
      .notEmpty().withMessage('Full name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword')
      .notEmpty().withMessage('Please confirm your password')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
    body('role')
      .notEmpty().withMessage('Please select a role')
      .isIn(['cashier', 'kitchen', 'customer', 'manager']).withMessage('Invalid role selected'),
    body('phone').optional().trim(),
    body('businessName').optional().trim(),
    body('employeeId').optional().trim(),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
          errors: errors.array(),
        });
      }

      const { fullName, username, email, password, role, phone, businessName, employeeId } = req.body;

      // Check if email already exists
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists',
          field: 'email',
        });
      }

      // Check if username already exists
      const existingUsername = await User.findOne({ username: username.toLowerCase() });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'This username is already taken',
          field: 'username',
        });
      }

      // Create user
      const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        role,
        phone: phone || '',
        businessName: role === 'manager' ? (businessName || '') : '',
        employeeId: ['cashier', 'kitchen'].includes(role) ? (employeeId || '') : '',
      });

      sendTokenResponse(user, 201, res);
    } catch (err) {
      console.error('Signup error:', err);

      // Handle Mongoose duplicate key error
      if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
          success: false,
          message: `This ${field} is already registered`,
          field,
        });
      }

      // Handle Mongoose validation errors
      if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(e => e.message)[0];
        return res.status(400).json({
          success: false,
          message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error. Please try again.',
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('login')
      .trim()
      .notEmpty().withMessage('Email or username is required'),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const { login, password } = req.body;

      // Find user by email or username (include password for comparison)
      const user = await User.findOne({
        $or: [
          { email: login.toLowerCase() },
          { username: login.toLowerCase() },
        ],
      }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials — user not found',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Contact your administrator.',
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials — incorrect password',
        });
      }

      // Update lastLogin
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      sendTokenResponse(user, 200, res);
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again.',
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (clear cookie)
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000), // 5 seconds
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @route   GET /api/auth/check-username/:username
// @desc    Check if username is available
// @access  Public
router.get('/check-username/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    res.json({
      success: true,
      available: !user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/auth/check-email/:email
// @desc    Check if email is available
// @access  Public
router.get('/check-email/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    res.json({
      success: true,
      available: !user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
