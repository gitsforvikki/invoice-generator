const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// Get all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Create a new item
router.post('/', async (req, res) => {
  try {
    const newItem = new Item(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create item', message: error.message });
  }
});

// Update an item
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update item', message: error.message });
  }
});

// Delete an item
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Seed some initial items for testing
router.post('/seed', async (req, res) => {
  try {
    const count = await Item.countDocuments();
    if (count === 0) {
      const seedItems = [
        { name: 'Web Development Services', description: 'Custom website development', basePrice: 1500 },
        { name: 'UI/UX Design', description: 'User interface design and prototyping', basePrice: 800 },
        { name: 'SEO Optimization', description: 'On-page and off-page SEO', basePrice: 500 },
        { name: 'Hosting & Maintenance', description: 'Annual hosting and maintenance', basePrice: 300 }
      ];
      await Item.insertMany(seedItems);
      res.status(201).json({ message: 'Database seeded with items' });
    } else {
      res.status(200).json({ message: 'Items already exist' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed items' });
  }
});

module.exports = router;

