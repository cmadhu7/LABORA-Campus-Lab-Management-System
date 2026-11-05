const express = require('express');
const router = express.Router();
const {
  getInventoryReport,
  getIssueHistoryReport,
  getDamagedReport,
  getUserWiseReport
} = require('../controllers/reportController');
const { verifyToken, requireStaffOrAdmin } = require('../middleware/authMiddleware');

router.get('/inventory', verifyToken, requireStaffOrAdmin, getInventoryReport);
router.get('/issues', verifyToken, requireStaffOrAdmin, getIssueHistoryReport);
router.get('/damaged', verifyToken, requireStaffOrAdmin, getDamagedReport);
router.get('/users', verifyToken, requireStaffOrAdmin, getUserWiseReport);

module.exports = router;
