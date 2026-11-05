const express = require('express');
const router = express.Router();
const {
  createIssue,
  returnIssue,
  getAllIssues,
  getIssueById
} = require('../controllers/issueController');
const { verifyToken, requireStaffOrAdmin } = require('../middleware/authMiddleware');

router.post('/', verifyToken, requireStaffOrAdmin, createIssue);
router.get('/', verifyToken, getAllIssues);
router.get('/:id', verifyToken, getIssueById);
router.put('/:id/return', verifyToken, requireStaffOrAdmin, returnIssue);

module.exports = router;
