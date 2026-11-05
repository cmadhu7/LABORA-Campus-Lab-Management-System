/**
 * LABORA – Centralized Enterprise Error Handler
 */

// Handle 404 Route Not Found
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: [${req.method}] ${req.originalUrl}`
  });
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
  console.error('[UNHANDLED ERROR]', err);

  // MySQL Specific Error Handling
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with this unique value (e.g. email or code) already exists.'
    });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete or alter this record because active dependent records (e.g. equipment issues) exist.'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced user or equipment ID does not exist in the database.'
    });
  }

  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error. Please contact administrator.',
    error: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
