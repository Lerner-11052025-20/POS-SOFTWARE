const mongoose = require('mongoose');

const posConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Terminal name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    paymentMethods: {
      cash: { type: Boolean, default: true },
      digital: { type: Boolean, default: false },
      qrPayment: { type: Boolean, default: false },
    },
    upiId: {
      type: String,
      trim: true,
      default: '',
    },
    lastSessionOpenedAt: {
      type: Date,
      default: null,
    },
    lastClosingSaleAmount: {
      type: Number,
      default: 0,
    },
    currentSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
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

posConfigSchema.index({ createdBy: 1 });
posConfigSchema.index({ isActive: 1 });

module.exports = mongoose.model('POSConfig', posConfigSchema);
