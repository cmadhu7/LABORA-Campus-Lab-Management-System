const { pool } = require('../config/db');

/**
 * Inventory Status Report
 */
const getInventoryReport = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    let query = `
      SELECT equipment_id, name, category, quantity, available_quantity, 
             (quantity - available_quantity) AS issued_quantity,
             ROUND((available_quantity / NULLIF(quantity, 0)) * 100, 1) AS availability_percent,
             status, location, model_number, updated_at
      FROM equipment
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY category ASC, name ASC';

    const [rows] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Comprehensive Issue & Return History Report with date range filtering
 */
const getIssueHistoryReport = async (req, res, next) => {
  try {
    const { start_date, end_date, status, department } = req.query;
    let query = `
      SELECT i.issue_id, i.issue_date, i.expected_return_date, i.return_date, 
             i.quantity, i.status, i.remarks,
             e.name AS equipment_name, e.category AS equipment_category,
             u.name AS user_name, u.email AS user_email, u.department, u.role
      FROM issue_records i
      JOIN equipment e ON i.equipment_id = e.equipment_id
      JOIN users u ON i.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += ' AND i.issue_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND i.issue_date <= ?';
      params.push(end_date);
    }
    if (status && status !== 'All') {
      query += ' AND i.status = ?';
      params.push(status);
    }
    if (department && department !== 'All') {
      query += ' AND u.department = ?';
      params.push(department);
    }

    query += ' ORDER BY i.issue_date DESC, i.issue_id DESC';

    const [rows] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Damaged Equipment Report
 */
const getDamagedReport = async (req, res, next) => {
  try {
    const [damagedEquip] = await pool.query(`
      SELECT equipment_id, name, category, quantity, available_quantity, location, model_number, status, updated_at
      FROM equipment
      WHERE status = 'Damaged'
      ORDER BY name ASC
    `);

    const [damagedIncidents] = await pool.query(`
      SELECT i.issue_id, i.issue_date, i.return_date, i.quantity, i.remarks,
             e.name AS equipment_name, e.category,
             u.name AS reported_by, u.email, u.department
      FROM issue_records i
      JOIN equipment e ON i.equipment_id = e.equipment_id
      JOIN users u ON i.user_id = u.user_id
      WHERE i.status = 'Damaged'
      ORDER BY i.return_date DESC
    `);

    res.status(200).json({
      success: true,
      data: {
        damagedEquipment: damagedEquip,
        damagedIncidents: damagedIncidents
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User-wise Borrowing Aggregation Report
 */
const getUserWiseReport = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.user_id, u.name, u.email, u.role, u.department,
        COUNT(i.issue_id) AS total_borrowings,
        COUNT(CASE WHEN i.status IN ('Issued', 'Overdue') THEN 1 END) AS active_borrowings,
        COUNT(CASE WHEN i.status = 'Returned' THEN 1 END) AS returned_count,
        COUNT(CASE WHEN i.status = 'Damaged' THEN 1 END) AS damaged_count
      FROM users u
      LEFT JOIN issue_records i ON u.user_id = i.user_id
      GROUP BY u.user_id
      ORDER BY active_borrowings DESC, total_borrowings DESC
    `);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventoryReport,
  getIssueHistoryReport,
  getDamagedReport,
  getUserWiseReport
};
