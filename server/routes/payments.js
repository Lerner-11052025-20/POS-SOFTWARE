const express = require('express');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/payments — List all payments
router.get('/', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('order', 'orderNumber total status')
      .populate('processedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/payments/grouped — Grouped by payment method
router.get('/grouped', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const grouped = await Payment.aggregate([
      {
        $group: {
          _id: '$method',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          payments: {
            $push: {
              _id: '$_id',
              amount: '$amount',
              orderNumber: '$orderNumber',
              customerName: '$customerName',
              createdAt: '$createdAt',
            },
          },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // Sort payments within each group
    grouped.forEach((g) => {
      g.payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      g.payments = g.payments.slice(0, 50);
    });

    res.json({ success: true, grouped });
  } catch (err) {
    console.error('Grouped payments error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/payments — Create payment
router.post('/', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const { method, amount, order, orderNumber, customer, customerName, session } = req.body;
    const payment = await Payment.create({
      method,
      amount,
      order: order || null,
      orderNumber: orderNumber || '',
      customer: customer || null,
      customerName: customerName || 'Walk-in Customer',
      session: session || null,
      processedBy: req.user._id,
    });

    res.status(201).json({ success: true, payment });
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
