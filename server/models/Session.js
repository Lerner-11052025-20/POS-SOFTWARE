const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    posConfig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'POSConfig',
      required: true,
    },
    openedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    orderCount: {
      type: Number,
      default: 0,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    closingBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ posConfig: 1, status: 1 });
sessionSchema.index({ openedBy: 1 });

module.exports = mongoose.model('Session', sessionSchema);
