const express = require('express');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');
const { getIO } = require('../utils/socket');

const router = express.Router();
router.use(protect);

// ──────────────────────────────────────────
// GET /api/kitchen/orders
// Fetch all kitchen-visible active orders
// ──────────────────────────────────────────
router.get('/orders', authorize('manager', 'cashier', 'kitchen'), async (req, res) => {
  try {
    const { stage } = req.query;
    const filter = {
      sentToKitchen: true,
      isArchived: false,
    };

    if (stage && stage !== 'all') {
      filter.status = stage;
    } else {
      filter.status = { $in: ['confirmed', 'preparing', 'ready', 'served', 'completed'] };
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('createdBy', 'fullName')
      .populate('table', 'tableNumber')
      .populate('floor', 'name')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, orders });
  } catch (err) {
    console.error('Kitchen fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────
// GET /api/kitchen/orders/history
// Fetch completed / served kitchen orders
// ──────────────────────────────────────────
router.get('/orders/history', authorize('manager', 'cashier', 'kitchen'), async (req, res) => {
  try {
    const orders = await Order.find({
      sentToKitchen: true,
      status: { $in: ['served', 'completed', 'cancelled'] },
      isArchived: false,
    })
      .populate('customer', 'name email phone')
      .populate('createdBy', 'fullName')
      .populate('table', 'tableNumber')
      .populate('floor', 'name')
      .sort({ updatedAt: -1 })
      .limit(100);

    res.json({ success: true, orders });
  } catch (err) {
    console.error('Kitchen history error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────
// GET /api/kitchen/orders/filters
// Products & categories in active tickets
// ──────────────────────────────────────────
router.get('/orders/filters', authorize('manager', 'cashier', 'kitchen'), async (req, res) => {
  try {
    const orders = await Order.find({
      sentToKitchen: true,
      status: { $in: ['confirmed', 'preparing', 'ready'] },
      isArchived: false,
    }).select('lines');

    const products = new Set();
    const categories = new Set();

    orders.forEach(o => {
      o.lines.forEach(l => {
        if (l.product) products.add(l.product);
        if (l.category) categories.add(l.category);
      });
    });

    res.json({
      success: true,
      products: Array.from(products).sort(),
      categories: Array.from(categories).sort(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ──────────────────────────────────────────
// PATCH /api/kitchen/orders/:orderId/items/:itemId/prepare
// Mark a single line item as prepared / unprepared
// ──────────────────────────────────────────
router.patch(
  '/orders/:orderId/items/:itemId/prepare',
  authorize('manager', 'kitchen'),
  async (req, res) => {
    try {
      const { isPrepared } = req.body;
      const order = await Order.findById(req.params.orderId);

      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      if (!order.sentToKitchen) return res.status(400).json({ success: false, message: 'Order not sent to kitchen' });

      const lineItem = order.lines.id(req.params.itemId);
      if (!lineItem) return res.status(404).json({ success: false, message: 'Item not found' });

      lineItem.isPrepared = isPrepared;
      lineItem.preparedAt = isPrepared ? new Date() : null;

      // Auto-advance to 'preparing' when first item is marked
      if (isPrepared && order.status === 'confirmed') {
        order.status = 'preparing';
        if (!order.kitchenStartedAt) {
          order.kitchenStartedAt = new Date();
        }
      }

      // Auto-advance to 'ready' when ALL items are prepared
      const allPrepared = order.lines.every(l => l.isPrepared);
      if (allPrepared && ['confirmed', 'preparing'].includes(order.status)) {
        order.status = 'ready';
        if (!order.kitchenCompletedAt) {
          order.kitchenCompletedAt = new Date();
        }
      }

      // If an item was un-prepared and order was 'ready', revert to 'preparing'
      if (!isPrepared && order.status === 'ready') {
        order.status = 'preparing';
        order.kitchenCompletedAt = null;
      }

      await order.save();

      const populated = await Order.findById(order._id)
        .populate('customer', 'name email phone')
        .populate('createdBy', 'fullName')
        .populate('table', 'tableNumber')
        .populate('floor', 'name');

      const io = getIO();
      io.to('kitchen').emit('kitchen_order_updated', { type: 'item_prepared', order: populated });
      io.to(`order_${order._id}`).emit('order_status_updated', {
        status: order.status,
        message: `Item "${lineItem.product}" ${isPrepared ? 'prepared' : 'unmarked'}`,
        updatedAt: new Date(),
        order: populated,
      });

      res.json({ success: true, order: populated });
    } catch (err) {
      console.error('Kitchen prepare item error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ──────────────────────────────────────────
// PATCH /api/kitchen/orders/:orderId/stage
// Move a ticket to a new kitchen stage
// ──────────────────────────────────────────
router.patch(
  '/orders/:orderId/stage',
  authorize('manager', 'kitchen'),
  async (req, res) => {
    try {
      const { stage } = req.body;
      const allowedStages = ['confirmed', 'preparing', 'ready', 'served', 'completed'];

      if (!allowedStages.includes(stage)) {
        return res.status(400).json({ success: false, message: 'Invalid kitchen stage' });
      }

      const order = await Order.findById(req.params.orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      if (!order.sentToKitchen) return res.status(400).json({ success: false, message: 'Order not sent to kitchen' });

      // Track kitchen timestamps
      if (stage === 'preparing' && !order.kitchenStartedAt) {
        order.kitchenStartedAt = new Date();
      }
      if (['ready', 'served', 'completed'].includes(stage) && !order.kitchenCompletedAt) {
        order.kitchenCompletedAt = new Date();
      }

      order.status = stage;
      await order.save();

      const populated = await Order.findById(order._id)
        .populate('customer', 'name email phone')
        .populate('createdBy', 'fullName')
        .populate('table', 'tableNumber')
        .populate('floor', 'name');

      const io = getIO();
      io.to('kitchen').emit('kitchen_order_updated', { type: 'stage_change', order: populated });
      io.to(`order_${order._id}`).emit('order_status_updated', {
        status: stage,
        message: `Order moved to ${stage}`,
        updatedAt: new Date(),
        order: populated,
      });

      res.json({ success: true, order: populated });
    } catch (err) {
      console.error('Kitchen stage update error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ──────────────────────────────────────────
// GET /api/kitchen/orders/:orderId/progress
// Public-ish order progress for customer display
// ──────────────────────────────────────────
router.get(
  '/orders/:orderId/progress',
  authorize('manager', 'cashier', 'kitchen', 'customer'),
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.orderId)
        .populate('table', 'tableNumber')
        .populate('floor', 'name')
        .select('orderNumber status lines table floor sentToKitchen kitchenStartedAt kitchenCompletedAt createdAt updatedAt');

      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      const totalItems = order.lines.length;
      const preparedItems = order.lines.filter(l => l.isPrepared).length;

      res.json({
        success: true,
        progress: {
          orderNumber: order.orderNumber,
          status: order.status,
          table: order.table,
          floor: order.floor,
          totalItems,
          preparedItems,
          percentComplete: totalItems > 0 ? Math.round((preparedItems / totalItems) * 100) : 0,
          kitchenStartedAt: order.kitchenStartedAt,
          kitchenCompletedAt: order.kitchenCompletedAt,
          items: order.lines.map(l => ({
            id: l._id,
            product: l.product,
            quantity: l.quantity,
            isPrepared: l.isPrepared,
            preparedAt: l.preparedAt,
          })),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

module.exports = router;
