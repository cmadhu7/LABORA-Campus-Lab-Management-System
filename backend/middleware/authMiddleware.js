/**
 * LABORA – Role-Based Authentication & Authorization Middleware
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'labora_enterprise_secret_key_2026';

/**
 * Validates JWT token from the Authorization header
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['x-access-token'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { user_id, email, name, role }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.'
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Invalid or malformed authentication token.'
    });
  }
};

/**
 * Restricts access to specific user roles
 * @param {Array<string>} roles - Permitted roles (e.g. ['admin', 'faculty'])
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] roles. Your role is '${req.user.role}'.`
      });
    }

    next();
  };
};

// Convenience role guards
const requireAdmin = requireRole('admin');
const requireStaffOrAdmin = requireRole('admin', 'faculty', 'lab_assistant');

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireStaffOrAdmin,
  JWT_SECRET
};
