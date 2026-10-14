const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'dang_iot',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+07:00'
});

// Kiểm tra kết nối ban đầu
pool.getConnection()
  .then(connection => {
    console.log('[MySQL] Database connected successfully.');
    connection.release();
  })
  .catch(err => {
    console.error('[MySQL Error] Connection failed:', err.message);
  });

module.exports = pool;
