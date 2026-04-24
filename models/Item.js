const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  variants: [{
    type: {
      type: String, // e.g., 'Size', 'Color', 'Weight'
      default: 'Size'
    },
    name: String, // e.g., 'Small', 'Red', '500g'
    priceAdjustment: {
      type: Number,
      default: 0
    }
  }],
  basePrice: {
    type: Number,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
