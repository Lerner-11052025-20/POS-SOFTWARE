const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Floor name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    posConfig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'POSConfig',
      required: [true, 'POS Configuration assignment is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure a floor name is unique per POS configuration
floorSchema.index({ name: 1, posConfig: 1 }, { unique: true });

module.exports = mongoose.model('Floor', floorSchema);
