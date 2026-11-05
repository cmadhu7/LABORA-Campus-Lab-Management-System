/**
 * LABORA – Campus Laboratory Asset Management System
 * Core Express Server Entrypoint
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { testConnection } = require('./config/db');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const userRoutes = require('./routes/userRoutes');
const issueRoutes = require('./routes/issueRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Stack
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, '../frontend')));

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Register REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Catch-All Handler for Frontend Routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Centralized Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Server Initialization
app.listen(PORT, async () => {
  console.log('======================================================');
  console.log('  LABORA – Campus Laboratory Asset Management System');
  console.log(`  Server running on: http://localhost:${PORT}`);
  console.log('======================================================');
  await testConnection();
});
