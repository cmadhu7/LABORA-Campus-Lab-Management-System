/**
 * LABORA – Database Configuration & Connection Pool
 * Uses mysql2/promise for enterprise-grade asynchronous connection pooling
 */
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'labora_db',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true // Returns dates as YYYY-MM-DD strings for consistent frontend formatting
});

/**
 * Diagnostic test to confirm database health on startup
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[DATABASE] Successfully connected to MySQL database: ${process.env.DB_NAME || 'labora_db'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[DATABASE ERROR] Failed to connect to MySQL:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
