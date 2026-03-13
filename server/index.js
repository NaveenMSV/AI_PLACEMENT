require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const path = require('path');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

// Import Routers
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const resumeRoutes = require('./routes/resumeRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const fs = require('fs');
app.use((req, res, next) => {
  const log = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;
  fs.appendFileSync(path.join(__dirname, 'server_logs.txt'), log);
  res.on('finish', () => {
    const endLog = `${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode}\n`;
    fs.appendFileSync(path.join(__dirname, 'server_logs.txt'), endLog);
  });
  next();
});

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/resume', resumeRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('Campus Placement Simulator API is fully operational.');
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  const errorMsg = `${new Date().toISOString()} - ERROR: ${err.message}\n${err.stack}\n`;
  console.error(errorMsg);
  fs.appendFileSync(path.join(__dirname, 'server_logs.txt'), errorMsg);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  console.log(`Attempting to start server on port ${PORT}...`);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless functions
module.exports = app;
