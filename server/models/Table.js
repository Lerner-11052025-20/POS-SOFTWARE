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
    status: {
      type: String,
      enum: ['available', 'occupied', 'booked', 'reserved'],
      default: 'available',
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reservedAt: {
      type: Date,
      default: null,
    },
    // Reference to a linked appointment or service resource (if needed)
    resourceRef: {
      type: String,
      trim: true,
      default: '',
    },
    qrToken: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
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
tableSchema.index({ status: 1, reservedAt: 1 });

module.exports = mongoose.model('Table', tableSchema);
