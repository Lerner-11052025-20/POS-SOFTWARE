const express = require('express');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/orders — List all orders
router.get('/', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const { status, archived } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (archived === 'true') filter.isArchived = true;
    else filter.isArchived = false;

    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, orders });
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/orders/:id — Single order detail
router.get('/:id', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'fullName');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/orders — Create order
router.post('/', authorize('manager', 'cashier', 'customer'), async (req, res) => {
  try {
    const { customerName, customer, sessionName, session, lines, paymentMethod, table, floor, notes } = req.body;
    const order = await Order.create({
      customerName: customerName || 'Walk-in Customer',
      customer: customer || null,
      sessionName: sessionName || '',
      session: session || null,
      lines: lines || [],
      paymentMethod: paymentMethod || '',
      table: table || null,
      floor: floor || null,
      notes: notes || '',
      createdBy: req.user._id,
    });

    const populated = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'fullName');

    res.status(201).json({ success: true, order: populated });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/orders/:id/archive — Archive orders
router.put('/archive', authorize('manager'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) {
      return res.status(400).json({ success: false, message: 'No orders selected' });
    }
    await Order.updateMany({ _id: { $in: ids } }, { isArchived: true });
    res.json({ success: true, message: `${ids.length} order(s) archived` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/orders — Delete draft orders only
router.delete('/', authorize('manager'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) {
      return res.status(400).json({ success: false, message: 'No orders selected' });
    }

    // BUSINESS RULE: Only draft orders can be deleted
    const orders = await Order.find({ _id: { $in: ids } });
    const nonDraft = orders.filter((o) => o.status !== 'draft');
    if (nonDraft.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${nonDraft.length} non-draft order(s). Only draft orders can be deleted.`,
      });
    }

    await Order.deleteMany({ _id: { $in: ids }, status: 'draft' });
    res.json({ success: true, message: `${ids.length} draft order(s) deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
