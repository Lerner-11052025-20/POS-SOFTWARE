const express = require('express');
const { body, validationResult } = require('express-validator');
const Table = require('../models/Table');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/tables — List tables (Manager, Cashier)
router.get('/', authorize('manager', 'cashier'), async (req, res) => {
  try {
    const { floor } = req.query;
    const filter = { isActive: true };
    if (floor) filter.floor = floor;

    const tables = await Table.find(filter).sort({ tableNumber: 1 });
    res.json({ success: true, tables });
  } catch (err) {
    console.error('Fetch tables error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/tables — Create (Manager)
router.post(
  '/',
  authorize('manager'),
  [
    body('tableNumber').trim().notEmpty().withMessage('Table number is required'),
    body('floor').notEmpty().withMessage('Floor assignment is required'),
    body('seatsCount').optional().isInt({ min: 1, max: 50 }).withMessage('Seats must be 1-50'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      // Check duplicate
      const numEscaped = req.body.tableNumber.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await Table.findOne({
        tableNumber: { $regex: new RegExp(`^${numEscaped}$`, 'i') },
        floor: req.body.floor,
      });

      if (existing) {
        if (!existing.isActive) {
          existing.isActive = true;
          existing.seatsCount = req.body.seatsCount || existing.seatsCount;
          existing.createdBy = req.user._id;
          await existing.save();
          return res.status(200).json({ success: true, table: existing, message: 'Table reactivated' });
        }
        return res.status(400).json({ success: false, message: 'Table number already exists on this floor' });
      }

      const table = await Table.create({
        ...req.body,
        createdBy: req.user._id,
      });

      res.status(201).json({ success: true, table });
    } catch (err) {
      console.error('Create table error:', err);
      if (err.code === 11000) return res.status(400).json({ success: false, message: 'Wait! This table number already exists on this floor' });
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// PUT /api/tables/:id — Update (Manager)
router.put('/:id', authorize('manager'), async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, table });
  } catch (err) {
    console.error('Update table error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/tables/bulk/duplicate — Bulk Duplicate (Manager)
router.post('/bulk/duplicate', authorize('manager'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ success: false, message: 'No tables selected' });

    const originals = await Table.find({ _id: { $in: ids } });
    const copies = [];

    for (const original of originals) {
      const copy = {
        tableNumber: `${original.tableNumber}-copy`,
        floor: original.floor,
        seatsCount: original.seatsCount,
        resourceRef: original.resourceRef,
        createdBy: req.user._id,
      };
      copies.push(copy);
    }

    const inserted = await Table.insertMany(copies);
    res.json({ success: true, message: `Successfully duplicated ${inserted.length} tables`, tables: inserted });
  } catch (err) {
    console.error('Bulk duplicate error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/tables/bulk — Bulk Delete (Manager)
router.delete('/bulk', authorize('manager'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ success: false, message: 'No tables selected' });

    // We do hard delete as these are configuration records
    await Table.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} table(s) deleted permanently` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
