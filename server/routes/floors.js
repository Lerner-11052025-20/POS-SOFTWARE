const express = require('express');
const { body, validationResult } = require('express-validator');
const Floor = require('../models/Floor');
const Table = require('../models/Table');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/floors — List floors (Manager, Cashier)
router.get('/', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const { posConfig } = req.query;
    const filter = { isActive: true };
    if (posConfig) filter.posConfig = posConfig;

    const floors = await Floor.find(filter).sort({ name: 1 });
    res.json({ success: true, floors });
  } catch (err) {
    console.error('Fetch floors error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/floors — Create (Manager)
router.post(
  '/',
  authorize('manager'),
  [
    body('name').trim().notEmpty().withMessage('Floor name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('posConfig').notEmpty().withMessage('POS application ID is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      // Check for duplicate name for the same POS config
      const nameEscaped = req.body.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await Floor.findOne({
        name: { $regex: new RegExp(`^${nameEscaped}$`, 'i') },
        posConfig: req.body.posConfig,
      });

      if (existing) {
        if (!existing.isActive) {
          existing.isActive = true;
          existing.createdBy = req.user._id;
          await existing.save();
          return res.status(200).json({ success: true, floor: existing, message: 'Floor reactivated' });
        }
        return res.status(400).json({ success: false, message: 'Floor name already exists for this POS' });
      }

      const floor = await Floor.create({
        ...req.body,
        createdBy: req.user._id,
      });

      res.status(201).json({ success: true, floor });
    } catch (err) {
      console.error('Create floor error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// PUT /api/floors/:id — Update (Manager)
router.put('/:id', authorize('manager'), async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (isActive !== undefined) update.isActive = isActive;

    const floor = await Floor.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!floor) {
      return res.status(404).json({ success: false, message: 'Floor not found' });
    }
    res.json({ success: true, floor });
  } catch (err) {
    console.error('Update floor error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/floors/:id — Removal (Soft Delete) (Manager)
router.delete('/:id', authorize('manager'), async (req, res) => {
  try {
    const floor = await Floor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!floor) return res.status(404).json({ success: false, message: 'Floor not found' });
    
    // Optional: Archive all tables on this floor too?
    await Table.updateMany({ floor: req.params.id }, { isActive: false });

    res.json({ success: true, message: 'Floor and linked tables removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
