const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: [true, 'Table number or label is required'],
      trim: true,
      maxlength: 20,
    },
    floor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      required: [true, 'Floor assignment is required'],
    },
    seatsCount: {
      type: Number,
      required: [true, 'Recommended seat count is required'],
      min: 1,
      max: 50,
      default: 4,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Reference to a linked appointment or service resource (if needed)
    resourceRef: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure a table number is unique per floor
tableSchema.index({ tableNumber: 1, floor: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
