const express = require('express');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/customers — List all customers
router.get('/', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search && search.trim()) {
      const s = search.trim();
      filter = {
        $or: [
          { name: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { phone: { $regex: s, $options: 'i' } },
        ],
      };
    }

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/customers/:id — Single customer
router.get('/:id', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/customers — Create customer
router.post(
  '/',
  authorize('manager', 'cashier'),
  [
    body('name').trim().notEmpty().withMessage('Customer name is required')
      .isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
    body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Invalid email format'),
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

      // Check duplicate email if provided
      if (req.body.email && req.body.email.trim()) {
        const exists = await Customer.findOne({
          email: req.body.email.trim().toLowerCase(),
        });
        if (exists) {
          return res.status(400).json({
            success: false,
            message: 'A customer with this email already exists',
            field: 'email',
          });
        }
      }

      const customer = await Customer.create({
        name: req.body.name,
        email: req.body.email || '',
        phone: req.body.phone || '',
        address1: req.body.address1 || '',
        address2: req.body.address2 || '',
        city: req.body.city || '',
        state: req.body.state || '',
        country: req.body.country || 'India',
        createdBy: req.user._id,
      });

      res.status(201).json({ success: true, customer });
    } catch (err) {
      console.error('Create customer error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// PUT /api/customers/:id — Update customer
router.put('/:id', authorize('manager'), async (req, res) => {
  try {
    const allowed = ['name', 'email', 'phone', 'address1', 'address2', 'city', 'state', 'country'];
    const update = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    });

    const customer = await Customer.findByIdAndUpdate(
      req.params.id, update, { new: true, runValidators: true }
    );
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
