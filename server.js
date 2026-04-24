require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const invoiceRoutes = require('./routes/invoiceRoutes');
const itemRoutes = require('./routes/itemRoutes');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthychef-invoices')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/invoices', invoiceRoutes);
app.use('/api/items', itemRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});