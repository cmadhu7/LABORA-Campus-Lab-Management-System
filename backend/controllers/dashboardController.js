const { pool } = require('../config/db');

/**
 * Get Real-Time Database Statistics for Admin Dashboard
 */
const getStats = async (req, res, next) => {
  try {
    // 1. Equipment Inventory Aggregations
    const [equipStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_equipment_types,
        IFNULL(SUM(quantity), 0) AS total_units,
        IFNULL(SUM(available_quantity), 0) AS available_units,
        IFNULL(SUM(quantity - available_quantity), 0) AS issued_units
      FROM equipment
    `);

    // 2. Active Issues and Overdue Items
    const [issueStats] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status IN ('Issued', 'Overdue') THEN 1 END) AS pending_returns,
        COUNT(CASE WHEN status = 'Overdue' OR (status = 'Issued' AND expected_return_date < CURDATE()) THEN 1 END) AS overdue_count
      FROM issue_records
    `);

    // 3. Damaged Equipment Items
    const [damagedStats] = await pool.query(`
      SELECT 
        COUNT(*) AS damaged_equipment_types,
        COUNT(CASE WHEN status = 'Damaged' THEN 1 END) AS total_damaged_records
      FROM equipment
      WHERE status = 'Damaged'
    `);

    // 4. Total Registered Users
    const [userStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_users,
        COUNT(CASE WHEN role = 'student' THEN 1 END) AS total_students,
        COUNT(CASE WHEN role = 'faculty' THEN 1 END) AS total_faculty
      FROM users
    `);

    const stats = {
      totalEquipment: parseInt(equipStats[0].total_units, 10),
      totalEquipmentTypes: parseInt(equipStats[0].total_equipment_types, 10),
      availableEquipment: parseInt(equipStats[0].available_units, 10),
      issuedEquipment: parseInt(equipStats[0].issued_units, 10),
      damagedEquipment: parseInt(damagedStats[0].damaged_equipment_types, 10),
      totalUsers: parseInt(userStats[0].total_users, 10),
      totalStudents: parseInt(userStats[0].total_students, 10),
      pendingReturns: parseInt(issueStats[0].pending_returns, 10),
      overdueReturns: parseInt(issueStats[0].overdue_count, 10)
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Chart Visualizations Data
 */
const getCharts = async (req, res, next) => {
  try {
    // A. Equipment Distribution by Category
    const [categories] = await pool.query(`
      SELECT category, COUNT(*) AS item_count, SUM(quantity) AS total_units, SUM(available_quantity) AS available_units
      FROM equipment
      GROUP BY category
      ORDER BY total_units DESC
    `);

    // B. Issue Status Breakdown
    const [statusBreakdown] = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM equipment
      GROUP BY status
    `);

    // C. Monthly Checkout Activity (Past 6 Months)
    const [monthlyTrends] = await pool.query(`
      SELECT 
        DATE_FORMAT(issue_date, '%b %Y') AS month_label,
        DATE_FORMAT(issue_date, '%Y-%m') AS sort_key,
        COUNT(*) AS issue_count,
        SUM(quantity) AS units_issued
      FROM issue_records
      GROUP BY sort_key, month_label
      ORDER BY sort_key ASC
      LIMIT 6
    `);

    res.status(200).json({
      success: true,
      data: {
        categories,
        statusBreakdown,
        monthlyTrends
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Recent Activity Feed
 */
const getRecentActivities = async (req, res, next) => {
  try {
    const [activities] = await pool.query(`
      SELECT i.issue_id, i.issue_date, i.return_date, i.quantity, i.status, i.created_at,
             e.name AS equipment_name, e.category,
             u.name AS user_name, u.role AS user_role, u.department
      FROM issue_records i
      JOIN equipment e ON i.equipment_id = e.equipment_id
      JOIN users u ON i.user_id = u.user_id
      ORDER BY i.created_at DESC
      LIMIT 8
    `);

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getCharts,
  getRecentActivities
};
