const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Item = require('../models/Item');

router.post('/', async (req, res) => {
  try {
    const { customerDetails, lineItems, gstPercentage = 18 } = req.body;

    if (!customerDetails || !customerDetails.name || !lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'Customer name and at least one line item are required.' });
    }

    let subTotal = 0;
    let totalDiscount = 0;
    const validatedLineItems = [];

    // Process each line item to ensure data integrity
    for (const item of lineItems) {
      // 1. Fetch the original item from DB to ensure price hasn't been tampered with
      // (Assuming itemId refers to an Item document)
      const dbItem = await Item.findById(item.itemId);
      if (!dbItem) {
        return res.status(404).json({ error: `Item with id ${item.itemId} not found.` });
      }

      const quantity = item.quantity || 1;
      const basePrice = dbItem.basePrice; // Always use DB price for integrity
      const discountType = item.discountType || 'FIXED';
      const discountValue = item.discountValue || 0;

      // Calculate discount amount
      let discountAmount = 0;
      if (discountType === 'PERCENTAGE') {
        discountAmount = (basePrice * quantity) * (discountValue / 100);
      } else {
        discountAmount = discountValue;
      }

      // Ensure discount isn't more than the total cost of the items
      if (discountAmount > basePrice * quantity) {
        discountAmount = basePrice * quantity;
      }

      // 2. Calculate row total before GST
      const rowTotalBeforeGST = (basePrice * quantity) - discountAmount;

      // 3. Apply GST formula: (Price * Qty - Discount) * (1 + GST/100)
      const rowTotalWithGST = rowTotalBeforeGST * (1 + (gstPercentage / 100));

      validatedLineItems.push({
        itemId: dbItem._id,
        name: dbItem.name, // Snapshot the name
        quantity: quantity,
        basePrice: basePrice,
        discountType: discountType,
        discountValue: discountValue,
        total: parseFloat(rowTotalWithGST.toFixed(2)) // Store rounded to 2 decimals
      });

      subTotal += rowTotalBeforeGST;
      totalDiscount += discountAmount;
    }

    // Calculate Grand Totals
    const gstAmount = subTotal * (gstPercentage / 100);
    const grandTotal = subTotal + gstAmount; // Same as sum of rowTotalWithGST

    const newInvoice = new Invoice({
      customerDetails,
      lineItems: validatedLineItems,
      gstPercentage,
      totals: {
        subTotal: parseFloat(subTotal.toFixed(2)),
        totalDiscount: parseFloat(totalDiscount.toFixed(2)),
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        grandTotal: parseFloat(grandTotal.toFixed(2))
      }
    });

    const savedInvoice = await newInvoice.save();
    res.status(201).json(savedInvoice);

  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice', details: error.message, stack: error.stack });
  }
});

router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

module.exports = router;
