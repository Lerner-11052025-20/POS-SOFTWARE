const express = require('express');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/payments — List all payments
router.get('/', authorize('manager', 'cashier', 'kitchen', 'customer'), async (req, res) => {
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
router.get('/grouped', authorize('manager', 'cashier', 'kitchen', 'customer'), async (req, res) => {
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

// POST /api/payments/razorpay/create-order
router.post('/razorpay/create-order', async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    
    // In production, validate user authorization here before payment
    
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit
      currency: 'INR',
      receipt: receipt || 'receipt_order_1',
    };
    
    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ success: false, message: 'Some error occurred' });
    }
    
    res.json({ success: true, order });
  } catch (err) {
    console.error('Razorpay create order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/payments/razorpay/verify
router.post('/razorpay/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      orderId, // DB order ID
    } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      // Signature is legit
      
      // Update order status if orderId provided
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'Paid',
          paymentMethod: 'razorpay'
        });
      }

      // Create Payment Record
      await Payment.create({
        method: 'razorpay',
        amount: amount,
        order: orderId || null,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        processedBy: req.user?._id || null, // fallback if anonymous
      });

      return res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid signature sent!' });
    }
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
