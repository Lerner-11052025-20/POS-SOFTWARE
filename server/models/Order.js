const mongoose = require('mongoose');

const orderLineSchema = new mongoose.Schema({
  product: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0 },
  uom: { type: String, default: 'Unit', trim: true },
  subtotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    sessionName: { type: String, default: '' },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    customerName: { type: String, default: 'Walk-in Customer' },
    status: {
      type: String,
      enum: ['draft', 'paid', 'cancelled'],
      default: 'draft',
    },
    lines: [orderLineSchema],
    subtotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paymentMethod: { type: String, default: '' },
    isArchived: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ isArchived: 1 });

// Auto-generate order number
orderSchema.pre('validate', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Calculate totals from lines
orderSchema.pre('save', function (next) {
  if (this.lines && this.lines.length > 0) {
    this.lines.forEach((line) => {
      line.subtotal = line.unitPrice * line.quantity;
      line.total = line.subtotal + (line.subtotal * line.tax) / 100;
    });
    this.subtotal = this.lines.reduce((sum, l) => sum + l.subtotal, 0);
    this.taxTotal = this.lines.reduce(
      (sum, l) => sum + (l.subtotal * l.tax) / 100,
      0
    );
    this.total = this.subtotal + this.taxTotal;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
