const mongoose = require('mongoose');
const Counter = require('./Counter');

const lineItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  name: String, // Stored to prevent historical changes if Item name changes
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  basePrice: {
    type: Number,
    required: true
  },
  variant: {
    type: { type: String },
    name: { type: String },
    priceAdjustment: { type: Number, default: 0 }
  },
  discountType: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED'],
    default: 'FIXED'
  },
  discountValue: {
    type: Number,
    default: 0
  },
  // Row total will be calculated as: (quantity * basePrice - discount) * (1 + GST/100)
  // We store it here for easy retrieval, though we recalculate it on save
  total: {
    type: Number,
    required: true
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String }
  },
  lineItems: [lineItemSchema],
  gstPercentage: {
    type: Number,
    default: 18 // Default GST in India e.g. 18%
  },
  totals: {
    subTotal: { type: Number, required: true }, // Before GST
    totalDiscount: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    grandTotal: { type: Number, required: true } // subTotal + gstAmount
  }
}, { timestamps: true });

// Pre-save hook for auto-incrementing Invoice Number
invoiceSchema.pre('save', async function () {
  const doc = this;
  if (doc.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { id: 'invoice_seq' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    const year = new Date().getFullYear();
    // Pad sequence with leading zeros (e.g., 0001, 0012)
    const seqStr = String(counter.seq).padStart(4, '0');
    doc.invoiceNumber = `INV-${year}-${seqStr}`;
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
