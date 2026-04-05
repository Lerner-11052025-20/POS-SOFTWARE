const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Table = require('../models/Table');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { emitOrderUpdate } = require('../utils/socket');

const router = express.Router();

// ─── GET /api/public/table/:token — Resolve QR token to table info ───
router.get('/table/:token', async (req, res) => {
  try {
    const table = await Table.findOne({
      qrToken: req.params.token,
      isActive: true,
    }).populate('floor', 'name');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or inactive table QR code',
      });
    }

    res.json({
      success: true,
      table: {
        _id: table._id,
        tableNumber: table.tableNumber,
        seatsCount: table.seatsCount,
        floor: table.floor,
        status: table.status,
      },
    });
  } catch (err) {
    console.error('Resolve QR token error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/public/menu — Public menu (categories + products) ───
router.get('/menu', async (req, res) => {
  try {
    const { search, category } = req.query;
    const productFilter = { isActive: true };
    if (category) productFilter.category = category;
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      productFilter.name = { $regex: escaped, $options: 'i' };
    }

    const [categories, products] = await Promise.all([
      Category.find({ isActive: true }).sort({ name: 1 }),
      Product.find(productFilter)
        .populate('category', 'name color')
        .sort({ name: 1 })
        .limit(200),
    ]);

    res.json({ success: true, categories, products });
  } catch (err) {
    console.error('Public menu error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /api/public/table/:token/order — Create public order ───
router.post('/table/:token/order', async (req, res) => {
  try {
    const table = await Table.findOne({
      qrToken: req.params.token,
      isActive: true,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or inactive table',
      });
    }

    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    // Server-side price validation — never trust frontend prices
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    }).populate('category', 'name');

    const productMap = new Map();
    products.forEach((p) => productMap.set(p._id.toString(), p));

    const lines = [];
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found or inactive: ${item.productId}`,
        });
      }
      if (!item.quantity || item.quantity < 1 || item.quantity > 100) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`,
        });
      }

      let unitPrice = product.salePrice;
      // Handle variant extra price
      if (item.variantId && product.variants?.length) {
        const variant = product.variants.id(item.variantId);
        if (variant) {
          unitPrice += variant.extraPrice || 0;
        }
      }

      lines.push({
        product: product.name,
        quantity: item.quantity,
        unitPrice,
        tax: product.tax || 0,
        category: product.category?.name || 'General',
        notes: (item.notes || '').slice(0, 200),
      });
    }

    const order = await Order.create({
      table: table._id,
      floor: table.floor,
      tableName: table.tableNumber,
      lines,
      status: 'draft',
      isPublicOrder: true,
      customerName: `Table ${table.tableNumber}`,
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Create public order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /api/public/razorpay/create-order — Razorpay order ───
router.post('/razorpay/create-order', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been paid',
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100),
      currency: 'INR',
      receipt: orderId,
    });

    if (!rzpOrder) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
      });
    }

    res.json({ success: true, order: rzpOrder, total: order.total });
  } catch (err) {
    console.error('Public Razorpay create-order error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /api/public/razorpay/verify — Verify payment ───
router.post('/razorpay/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification fields',
      });
    }

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Update order: confirm + send to kitchen
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.paymentMethod = 'razorpay';
    order.sentToKitchen = true;
    order.status = 'confirmed';
    await order.save();

    // Create payment record
    await Payment.create({
      method: 'razorpay',
      amount: order.total,
      order: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    // Populate and emit real-time update to kitchen
    const populated = await Order.findById(order._id)
      .populate('table', 'tableNumber')
      .populate('floor', 'name');

    emitOrderUpdate(order._id, {
      status: 'confirmed',
      message: 'New QR order confirmed',
      order: populated,
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      order: populated,
    });
  } catch (err) {
    console.error('Public Razorpay verify error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/public/orders/:orderId/status — Order status ───
router.get('/orders/:orderId/status', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('table', 'tableNumber')
      .populate('floor', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        lines: order.lines,
        subtotal: order.subtotal,
        taxTotal: order.taxTotal,
        total: order.total,
        tableName: order.tableName,
        table: order.table,
        floor: order.floor,
        paymentMethod: order.paymentMethod,
        sentToKitchen: order.sentToKitchen,
        kitchenStartedAt: order.kitchenStartedAt,
        kitchenCompletedAt: order.kitchenCompletedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (err) {
    console.error('Public order status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/public/table/:token/orders — Order history for table ───
router.get('/table/:token/orders', async (req, res) => {
  try {
    const table = await Table.findOne({
      qrToken: req.params.token,
      isActive: true,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Invalid table',
      });
    }

    // Get orders for this table from the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const orders = await Order.find({
      table: table._id,
      isPublicOrder: true,
      createdAt: { $gte: since },
      status: { $ne: 'draft' },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, orders });
  } catch (err) {
    console.error('Public table orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
