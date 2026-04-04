const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  attribute: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
  uom: { type: String, default: 'Unit', enum: ['Unit', 'Kg', 'Liter', 'Pack'] },
  extraPrice: { type: Number, default: 0, min: 0 },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    salePrice: {
      type: Number,
      required: [true, 'Sale price is required'],
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      enum: [0, 5, 12, 18, 28],
    },
    uom: {
      type: String,
      default: 'Unit',
      enum: ['Unit', 'Kg', 'Liter', 'Pack'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    variants: [variantSchema],
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
