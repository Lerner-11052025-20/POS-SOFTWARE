const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/products — List all products
router.get('/', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const { search, category, active } = req.query;
    const filter = {};

    if (active !== 'all') filter.isActive = active !== 'false';
    if (category) filter.category = category;
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const products = await Product.find(filter)
      .populate('category', 'name color')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, products });
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/products/:id — Single product
router.get('/:id', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name color');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/products — Create product
router.post(
  '/',
  authorize('manager'),
  [
    body('name').trim().notEmpty().withMessage('Product name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('salePrice').isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
    body('tax').optional().isIn([0, 5, 12, 18, 28]).withMessage('Invalid tax rate'),
    body('uom').optional().isIn(['Unit', 'Kg', 'Liter', 'Pack']).withMessage('Invalid UOM'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const { name, category, salePrice, tax, uom, description, variants } = req.body;

      const product = await Product.create({
        name: name.trim(),
        category: category || null,
        salePrice,
        tax: tax || 0,
        uom: uom || 'Unit',
        description: description || '',
        variants: variants || [],
        createdBy: req.user._id,
      });

      const populated = await Product.findById(product._id)
        .populate('category', 'name color');

      res.status(201).json({ success: true, product: populated });
    } catch (err) {
      console.error('Create product error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// PUT /api/products/:id — Update product
router.put('/:id', authorize('manager'), async (req, res) => {
  try {
    const allowed = ['name', 'category', 'salePrice', 'tax', 'uom', 'description', 'variants', 'isActive'];
    const update = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    });

    const product = await Product.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate('category', 'name color');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/products/bulk/archive — Bulk archive
router.put('/bulk/archive', authorize('manager'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) {
      return res.status(400).json({ success: false, message: 'No products selected' });
    }
    await Product.updateMany({ _id: { $in: ids } }, { isActive: false });
    res.json({ success: true, message: `${ids.length} product(s) archived` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/products/bulk — Bulk delete
router.delete('/bulk', authorize('manager'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) {
      return res.status(400).json({ success: false, message: 'No products selected' });
    }
    await Product.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} product(s) deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
