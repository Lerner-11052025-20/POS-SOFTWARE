const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      match: [/^\S+@\S+\.\S+$|^$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address1: { type: String, trim: true, default: '' },
    address2: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
    totalSales: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', email: 'text', phone: 'text' });
customerSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Customer', customerSchema);
