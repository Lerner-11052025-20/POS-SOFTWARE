const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/categories — List all categories
router.get('/', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const filter = { isActive: true };
    const categories = await Category.find(filter).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/categories — Create category
router.post(
  '/',
  authorize('manager'),
  [
    body('name').trim().notEmpty().withMessage('Category name is required')
      .isLength({ min: 2, max: 40 }).withMessage('Name must be 2-40 characters'),
    body('color').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      // Duplicate check (including deactivated ones)
      const nameEscaped = req.body.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${nameEscaped}$`, 'i') },
      });

      if (existing) {
        if (!existing.isActive) {
          // If it exists but is inactive, reactivate it instead of erroring
          existing.isActive = true;
          existing.color = req.body.color || existing.color;
          existing.createdBy = req.user._id;
          await existing.save();
          return res.status(200).json({ success: true, category: existing, message: 'Existing category reactivated' });
        }
        return res.status(400).json({
          success: false,
          message: 'A category with this name already exists',
        });
      }

      const category = await Category.create({
        name: req.body.name.trim(),
        color: req.body.color || '#F59E0B',
        createdBy: req.user._id,
      });

      res.status(201).json({ success: true, category });
    } catch (err) {
      console.error('Create category error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// PUT /api/categories/:id — Update category
router.put('/:id', authorize('manager'), async (req, res) => {
  try {
    const { name, color } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (color) update.color = color;

    if (name) {
      const nameEscaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const dup = await Category.findOne({
        name: { $regex: new RegExp(`^${nameEscaped}$`, 'i') },
        _id: { $ne: req.params.id },
      });
      if (dup) {
        return res.status(400).json({ success: false, message: 'Category name already taken' });
      }
    }

    const category = await Category.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, category });
  } catch (err) {
    console.error('Update category error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors)[0].message });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/categories/:id — Soft delete
router.delete('/:id', authorize('manager'), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
