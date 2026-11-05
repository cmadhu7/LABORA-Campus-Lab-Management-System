const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Get All Users with filtering and search
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    let query = 'SELECT user_id, name, email, role, department, phone, status, created_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR department LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (role && role !== 'All') {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY user_id DESC';

    const [users] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single User Details + Activity History
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT user_id, name, email, role, department, phone, status, created_at FROM users WHERE user_id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `User with ID #${id} not found.`
      });
    }

    const [issues] = await pool.query(
      `SELECT i.issue_id, i.issue_date, i.return_date, i.expected_return_date, i.quantity, i.status,
              e.name AS equipment_name, e.category AS equipment_category
       FROM issue_records i
       JOIN equipment e ON i.equipment_id = e.equipment_id
       WHERE i.user_id = ?
       ORDER BY i.issue_id DESC`,
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
 * Create New User
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required fields.'
      });
    }

    const validRoles = ['admin', 'student', 'faculty', 'lab_assistant'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified. Permitted roles: ${validRoles.join(', ')}`
      });
    }

    // Check duplicate email
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address is already registered.'
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, department, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        hashedPassword,
        role,
        department || 'General',
        phone || null
      ]
    );

    const [newUser] = await pool.query(
      'SELECT user_id, name, email, role, department, phone, status, created_at FROM users WHERE user_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: newUser[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Existing User
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, department, phone, status } = req.body;

    const [current] = await pool.query('SELECT * FROM users WHERE user_id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({
        success: false,
        message: `User #${id} not found.`
      });
    }

    const existing = current[0];

    // Check duplicate email if changed
    if (email && email.trim().toLowerCase() !== existing.email) {
      const [duplicate] = await pool.query('SELECT user_id FROM users WHERE email = ? AND user_id != ?', [
        email.trim().toLowerCase(),
        id
      ]);
      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email address already in use by another user.'
        });
      }
    }

    let updatedPassword = existing.password;
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      updatedPassword = await bcrypt.hash(password, salt);
    }

    await pool.query(
      `UPDATE users 
       SET name = ?, email = ?, password = ?, role = ?, department = ?, phone = ?, status = ?
       WHERE user_id = ?`,
      [
        name ? name.trim() : existing.name,
        email ? email.trim().toLowerCase() : existing.email,
        updatedPassword,
        role || existing.role,
        department !== undefined ? department : existing.department,
        phone !== undefined ? phone : existing.phone,
        status || existing.status,
        id
      ]
    );

    const [updated] = await pool.query(
      'SELECT user_id, name, email, role, department, phone, status, updated_at FROM users WHERE user_id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'User details updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete User
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user has active borrowings
    const [active] = await pool.query(
      `SELECT COUNT(*) AS count FROM issue_records WHERE user_id = ? AND status IN ('Issued', 'Overdue')`,
      [id]
    );

    if (active[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user #${id}. This user currently has ${active[0].count} unreturned equipment items.`
      });
    }

    const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `User #${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      message: `User #${id} removed successfully.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
