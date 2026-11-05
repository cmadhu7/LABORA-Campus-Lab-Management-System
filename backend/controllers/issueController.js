const { pool } = require('../config/db');

/**
 * Issue Equipment to a Student or Faculty
 * Uses ACID SQL Transaction to guarantee stock integrity and prevent race conditions
 */
const createIssue = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const { equipment_id, user_id, quantity, expected_return_date, remarks } = req.body;

    // Validate inputs
    if (!equipment_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Please select both an equipment item and a valid user.'
      });
    }

    const issueQty = parseInt(quantity, 10) || 1;
    if (issueQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Issue quantity must be greater than zero.'
      });
    }

    // Begin ACID SQL Transaction
    await connection.beginTransaction();

    // 1. Verify User Exists and is Active
    const [userRows] = await connection.query(
      'SELECT user_id, name, email, status FROM users WHERE user_id = ? LIMIT 1',
      [user_id]
    );

    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `User #${user_id} does not exist.`
      });
    }

    if (userRows[0].status !== 'Active') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot issue equipment: User account is ${userRows[0].status}.`
      });
    }

    // 2. Lock and Check Equipment Stock using FOR UPDATE to prevent race conditions
    const [equipmentRows] = await connection.query(
      'SELECT equipment_id, name, quantity, available_quantity, status FROM equipment WHERE equipment_id = ? FOR UPDATE',
      [equipment_id]
    );

    if (equipmentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `Equipment #${equipment_id} does not exist.`
      });
    }

    const equip = equipmentRows[0];

    if (equip.status === 'Damaged' || equip.status === 'Maintenance') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Equipment '${equip.name}' is currently flagged as '${equip.status}' and cannot be issued.`
      });
    }

    if (equip.available_quantity < issueQty) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient inventory for '${equip.name}'. Available: ${equip.available_quantity}, Requested: ${issueQty}.`
      });
    }

    // 3. Decrement available_quantity and update equipment status if depleted
    const newAvailable = equip.available_quantity - issueQty;
    let newStatus = equip.status;
    if (newAvailable === 0) {
      newStatus = 'Out of Stock';
    } else if (newAvailable <= 2) {
      newStatus = 'Low Stock';
    }

    await connection.query(
      'UPDATE equipment SET available_quantity = ?, status = ? WHERE equipment_id = ?',
      [newAvailable, newStatus, equipment_id]
    );

    // 4. Insert new record into issue_records
    const issueDate = new Date().toISOString().slice(0, 10);
    const expectedReturn = expected_return_date || null;

    const [insertResult] = await connection.query(
      `INSERT INTO issue_records 
       (equipment_id, user_id, issue_date, expected_return_date, quantity, status, remarks)
       VALUES (?, ?, ?, ?, ?, 'Issued', ?)`,
      [equipment_id, user_id, issueDate, expectedReturn, issueQty, remarks || null]
    );

    // Commit Transaction
    await connection.commit();

    // Fetch joined record to return complete details
    const [createdRecord] = await pool.query(
      `SELECT i.*, e.name AS equipment_name, e.category AS equipment_category,
              u.name AS user_name, u.email AS user_email, u.department
       FROM issue_records i
       JOIN equipment e ON i.equipment_id = e.equipment_id
       JOIN users u ON i.user_id = u.user_id
       WHERE i.issue_id = ?`,
      [insertResult.insertId]
    );

    res.status(201).json({
      success: true,
      message: `Successfully issued ${issueQty} unit(s) of '${equip.name}' to ${userRows[0].name}.`,
      data: createdRecord[0]
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Return Equipment
 * Uses ACID SQL Transaction to increment inventory and close transaction
 */
const returnIssue = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { return_condition, return_remarks } = req.body;

    // Begin ACID SQL Transaction
    await connection.beginTransaction();

    // 1. Lock and Check Issue Record
    const [issueRows] = await connection.query(
      'SELECT * FROM issue_records WHERE issue_id = ? FOR UPDATE',
      [id]
    );

    if (issueRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `Issue record #${id} not found.`
      });
    }

    const issue = issueRows[0];

    if (issue.status === 'Returned') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `This issue record (#${id}) has already been returned on ${issue.return_date}.`
      });
    }

    // 2. Lock and Update Equipment Inventory
    const [equipRows] = await connection.query(
      'SELECT equipment_id, name, quantity, available_quantity, status FROM equipment WHERE equipment_id = ? FOR UPDATE',
      [issue.equipment_id]
    );

    if (equipRows.length > 0) {
      const equip = equipRows[0];
      const isDamaged = return_condition === 'Damaged';
      
      // If marked damaged, units are not added back to available unless repaired
      const restoredAvailable = isDamaged 
        ? equip.available_quantity 
        : Math.min(equip.quantity, equip.available_quantity + issue.quantity);
      
      let equipStatus = equip.status;
      if (isDamaged) {
        equipStatus = 'Damaged';
      } else if (restoredAvailable > 0 && equip.status === 'Out of Stock') {
        equipStatus = 'Available';
      }

      await connection.query(
        'UPDATE equipment SET available_quantity = ?, status = ? WHERE equipment_id = ?',
        [restoredAvailable, equipStatus, equip.equipment_id]
      );
    }

    // 3. Update Issue Record
    const returnDate = new Date().toISOString().slice(0, 10);
    const finalStatus = return_condition === 'Damaged' ? 'Damaged' : 'Returned';
    
    let combinedRemarks = issue.remarks || '';
    if (return_remarks) {
      combinedRemarks += (combinedRemarks ? ' | ' : '') + `Return Note: ${return_remarks.trim()}`;
    }

    await connection.query(
      `UPDATE issue_records 
       SET return_date = ?, status = ?, remarks = ?
       WHERE issue_id = ?`,
      [returnDate, finalStatus, combinedRemarks, id]
    );

    // Commit Transaction
    await connection.commit();

    const [updatedRecord] = await pool.query(
      `SELECT i.*, e.name AS equipment_name, u.name AS user_name, u.email AS user_email
       FROM issue_records i
       JOIN equipment e ON i.equipment_id = e.equipment_id
       JOIN users u ON i.user_id = u.user_id
       WHERE i.issue_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: `Equipment successfully returned and inventory synchronized.`,
      data: updatedRecord[0]
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Get All Issue Transactions with comprehensive joined data and filters
 */
const getAllIssues = async (req, res, next) => {
  try {
    const { status, user_id, equipment_id, search } = req.query;
    let query = `
      SELECT i.issue_id, i.equipment_id, i.user_id, i.issue_date, i.return_date, 
             i.expected_return_date, i.quantity, i.status, i.remarks, i.created_at,
             e.name AS equipment_name, e.category AS equipment_category, e.location,
             u.name AS user_name, u.email AS user_email, u.department, u.role
      FROM issue_records i
      JOIN equipment e ON i.equipment_id = e.equipment_id
      JOIN users u ON i.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      query += ' AND i.status = ?';
      params.push(status);
    }

    if (user_id) {
      query += ' AND i.user_id = ?';
      params.push(user_id);
    }

    if (equipment_id) {
      query += ' AND i.equipment_id = ?';
      params.push(equipment_id);
    }

    if (search) {
      query += ' AND (e.name LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY i.issue_id DESC';

    const [records] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Issue Details
 */
const getIssueById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT i.*, 
              e.name AS equipment_name, e.category AS equipment_category, e.location, e.available_quantity,
              u.name AS user_name, u.email AS user_email, u.department, u.phone
       FROM issue_records i
       JOIN equipment e ON i.equipment_id = e.equipment_id
       JOIN users u ON i.user_id = u.user_id
       WHERE i.issue_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Issue record #${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIssue,
  returnIssue,
  getAllIssues,
  getIssueById
};
