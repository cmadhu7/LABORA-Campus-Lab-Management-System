const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, requireAdmin, getAllUsers);
router.get('/:id', verifyToken, requireAdmin, getUserById);
router.post('/', verifyToken, requireAdmin, createUser);
router.put('/:id', verifyToken, requireAdmin, updateUser);
router.delete('/:id', verifyToken, requireAdmin, deleteUser);

module.exports = router;
