// config/db.js — legacy MySQL adapter (disabled in Mongo-only mode)
require('dotenv').config();

const isMysqlMode = (process.env.DB_PROVIDER || '').toLowerCase() === 'mysql';

if (!isMysqlMode) {
  module.exports = {
    query: async () => {
      throw new Error('MySQL adapter is disabled. This endpoint is not migrated to MongoDB yet.');
    },
  };
} else {
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({
    host:               process.env.DB_HOST     || 'localhost',
    port:               Number(process.env.DB_PORT) || 3306,
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'tourism_support_db',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    timezone:           '+00:00',
  });
  module.exports = pool;
}
