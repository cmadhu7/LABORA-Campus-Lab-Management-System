const express = require('express');
const router = express.Router();
const { getStats, getCharts, getRecentActivities } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/stats', verifyToken, getStats);
router.get('/charts', verifyToken, getCharts);
router.get('/recent-activities', verifyToken, getRecentActivities);

module.exports = router;
