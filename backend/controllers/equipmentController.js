const { pool } = require('../config/db');

/**
 * Get All Equipment with filtering, searching, and pagination
 */
const getAllEquipment = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    let query = 'SELECT * FROM equipment WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR model_number LIKE ? OR location LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY equipment_id DESC';

    const [equipmentList] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: equipmentList.length,
      data: equipmentList
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Equipment by ID with active borrow history
 */
const getEquipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM equipment WHERE equipment_id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Equipment with ID #${id} not found.`
      });
    }

    // Get active and recent issues for this equipment
    const [issues] = await pool.query(
      `SELECT i.issue_id, i.issue_date, i.expected_return_date, i.return_date, i.quantity, i.status,
              u.name AS student_name, u.email AS student_email, u.department
       FROM issue_records i
       JOIN users u ON i.user_id = u.user_id
       WHERE i.equipment_id = ?
       ORDER BY i.issue_id DESC LIMIT 10`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...rows[0],
        issues
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create New Equipment
 */
const createEquipment = async (req, res, next) => {
  try {
    const { name, category, quantity, location, model_number } = req.body;

    if (!name || !category || quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: 'Please provide equipment name, category, and total quantity.'
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total quantity must be a non-negative integer.'
      });
    }

    const available_quantity = qty;
    const status = qty === 0 ? 'Out of Stock' : 'Available';

    const [result] = await pool.query(
      `INSERT INTO equipment (name, category, quantity, available_quantity, status, location, model_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), category.trim(), qty, available_quantity, status, location || 'General Laboratory', model_number || null]
    );

    const [newRecord] = await pool.query('SELECT * FROM equipment WHERE equipment_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Equipment registered successfully.',
      data: newRecord[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Existing Equipment
 */
const updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, status, location, model_number } = req.body;

    const [current] = await pool.query('SELECT * FROM equipment WHERE equipment_id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Equipment with ID #${id} not found.`
      });
    }

    const existing = current[0];
    const newQty = quantity !== undefined ? parseInt(quantity, 10) : existing.quantity;

    if (isNaN(newQty) || newQty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative integer.'
      });
    }

    // Calculate borrowed units currently out
    const borrowedUnits = existing.quantity - existing.available_quantity;
    if (newQty < borrowedUnits) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce total quantity to ${newQty}. There are currently ${borrowedUnits} units actively checked out by students.`
      });
    }

    const newAvailable = newQty - borrowedUnits;
    let finalStatus = status || existing.status;
    if (newAvailable === 0 && finalStatus === 'Available') {
      finalStatus = 'Out of Stock';
    } else if (newAvailable > 0 && finalStatus === 'Out of Stock') {
      finalStatus = 'Available';
    }

    await pool.query(
      `UPDATE equipment 
       SET name = ?, category = ?, quantity = ?, available_quantity = ?, status = ?, location = ?, model_number = ?
       WHERE equipment_id = ?`,
      [
        name ? name.trim() : existing.name,
        category ? category.trim() : existing.category,
        newQty,
        newAvailable,
        finalStatus,
        location !== undefined ? location : existing.location,
        model_number !== undefined ? model_number : existing.model_number,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM equipment WHERE equipment_id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Equipment details updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Equipment
 * Verifies no active issue records exist before deleting
 */
const deleteEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [activeIssues] = await pool.query(
      `SELECT COUNT(*) AS activeCount FROM issue_records WHERE equipment_id = ? AND status IN ('Issued', 'Overdue')`,
      [id]
    );

    if (activeIssues[0].activeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete equipment. There are ${activeIssues[0].activeCount} active unreturned checkout(s) for this item.`
      });
    }

    const [result] = await pool.query('DELETE FROM equipment WHERE equipment_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Equipment with ID #${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      message: `Equipment #${id} removed successfully.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
};
