const express = require('express');
const { body, validationResult } = require('express-validator');
const POSConfig = require('../models/POSConfig');
const Session = require('../models/Session');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ─── GET /api/pos/configs ────────────────────────────────────
// Fetch all POS configurations (manager: all, cashier/customer: active only)
router.get('/configs', authorize('manager', 'cashier', 'customer'), async (req, res) => {
  try {
    const filter = req.user.role === 'manager' ? {} : { isActive: true };
    const configs = await POSConfig.find(filter)
      .populate('createdBy', 'fullName username')
      .populate('currentSessionId')
      .sort({ createdAt: -1 });

    res.json({ success: true, configs });
  } catch (err) {
    console.error('Fetch configs error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/pos/configs/:id ────────────────────────────────
// Fetch single POS configuration (Manager, Cashier, Customer)
router.get('/configs/:id', authorize('manager', 'cashier', 'customer'), async (req, res) => {
  try {
    let config;
    if (req.params.id === 'default') {
      config = await POSConfig.findOne({ isActive: true })
        .populate('createdBy', 'fullName username')
        .populate('currentSessionId');
    } else {
      config = await POSConfig.findById(req.params.id)
        .populate('createdBy', 'fullName username')
        .populate('currentSessionId');
    }

    if (!config) {
      return res.status(404).json({ success: false, message: 'Terminal not found' });
    }

    res.json({ success: true, config });
  } catch (err) {
    console.error('Fetch config error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /api/pos/configs ───────────────────────────────────
// Create a new POS terminal (manager only)
router.post(
  '/configs',
  authorize('manager'),
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Terminal name is required')
      .isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
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

      const config = await POSConfig.create({
        name: req.body.name,
        createdBy: req.user._id,
      });

      const populated = await POSConfig.findById(config._id)
        .populate('createdBy', 'fullName username');

      res.status(201).json({ success: true, config: populated });
    } catch (err) {
      console.error('Create config error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─── PUT /api/pos/configs/:id ────────────────────────────────
// Update POS terminal settings (manager only)
router.put(
  '/configs/:id',
  authorize('manager'),
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const update = {};
      if (req.body.name) update.name = req.body.name.trim();
      if (typeof req.body.isFloorPlanEnabled === 'boolean') update.isFloorPlanEnabled = req.body.isFloorPlanEnabled;
      if (typeof req.body.isActive === 'boolean') update.isActive = req.body.isActive;

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ success: false, message: 'No valid fields to update' });
      }

      const config = await POSConfig.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true, runValidators: true }
      ).populate('createdBy', 'fullName username');

      if (!config) {
        return res.status(404).json({ success: false, message: 'Terminal not found' });
      }

      res.json({ success: true, config });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─── DELETE /api/pos/configs/:id ─────────────────────────────
// Soft-delete a POS terminal (manager only)
router.delete('/configs/:id', authorize('manager'), async (req, res) => {
  try {
    const config = await POSConfig.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!config) {
      return res.status(404).json({ success: false, message: 'Terminal not found' });
    }

    res.json({ success: true, message: 'Terminal deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── PUT /api/pos/configs/:id/payment-methods ────────────────
// Update payment method settings (manager only)
router.put(
  '/configs/:id/payment-methods',
  authorize('manager'),
  async (req, res) => {
    try {
      const { cash, digital, qrPayment, upiId } = req.body;
      const update = {};

      if (typeof cash === 'boolean') update['paymentMethods.cash'] = cash;
      if (typeof digital === 'boolean') update['paymentMethods.digital'] = digital;
      if (typeof qrPayment === 'boolean') update['paymentMethods.qrPayment'] = qrPayment;
      if (typeof upiId === 'string') update.upiId = upiId.trim();

      // If QR payment is disabled, clear the UPI ID
      if (qrPayment === false) update.upiId = '';

      const config = await POSConfig.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true, runValidators: true }
      ).populate('createdBy', 'fullName username');

      if (!config) {
        return res.status(404).json({ success: false, message: 'Terminal not found' });
      }

      res.json({ success: true, config });
    } catch (err) {
      console.error('Update payment error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─── POST /api/pos/configs/:id/open-session ──────────────────
// Open a new session for a terminal
router.post(
  '/configs/:id/open-session',
  authorize('manager', 'cashier'),
  async (req, res) => {
    try {
      const config = await POSConfig.findById(req.params.id);
      if (!config) {
        return res.status(404).json({ success: false, message: 'Terminal not found' });
      }

      // Check for existing open session
      if (config.currentSessionId) {
        const existingSession = await Session.findById(config.currentSessionId);
        if (existingSession && existingSession.status === 'open') {
          return res.status(400).json({
            success: false,
            message: 'A session is already open on this terminal',
          });
        }
      }

      // Create new session
      const session = await Session.create({
        posConfig: config._id,
        openedBy: req.user._id,
        openingBalance: req.body.openingBalance || 0,
      });

      // Update config with session reference
      config.currentSessionId = session._id;
      config.lastSessionOpenedAt = session.openedAt;
      await config.save();

      const populatedSession = await Session.findById(session._id)
        .populate('openedBy', 'fullName username');

      res.status(201).json({ success: true, session: populatedSession });
    } catch (err) {
      console.error('Open session error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─── POST /api/pos/configs/:id/close-session ─────────────────
// Close the current session
router.post(
  '/configs/:id/close-session',
  authorize('manager', 'cashier'),
  async (req, res) => {
    try {
      const config = await POSConfig.findById(req.params.id);
      if (!config || !config.currentSessionId) {
        return res.status(400).json({ success: false, message: 'No active session to close' });
      }

      const session = await Session.findById(config.currentSessionId);
      if (!session || session.status !== 'open') {
        return res.status(400).json({ success: false, message: 'No open session found' });
      }

      session.status = 'closed';
      session.closedAt = new Date();
      session.closingBalance = req.body.closingBalance || session.totalSales;
      await session.save();

      config.lastClosingSaleAmount = session.totalSales;
      config.currentSessionId = null;
      await config.save();

      res.json({ success: true, session });
    } catch (err) {
      console.error('Close session error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─── GET /api/pos/configs/:id/sessions ───────────────────────
// Get session history for a terminal
router.get('/configs/:id/sessions', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const sessions = await Session.find({ posConfig: req.params.id })
      .populate('openedBy', 'fullName username')
      .sort({ openedAt: -1 })
      .limit(10);

    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
