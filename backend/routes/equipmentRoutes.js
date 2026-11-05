const express = require('express');
const router = express.Router();
const {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
} = require('../controllers/equipmentController');
const { verifyToken, requireAdmin, requireStaffOrAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllEquipment);
router.get('/:id', verifyToken, getEquipmentById);
router.post('/', verifyToken, requireStaffOrAdmin, createEquipment);
router.put('/:id', verifyToken, requireStaffOrAdmin, updateEquipment);
router.delete('/:id', verifyToken, requireAdmin, deleteEquipment);

module.exports = router;
