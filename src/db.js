// src/db.js
const mysql = require('mysql2/promise');  // Import mysql2/promise
const { v4: uuidv4 } = require('uuid');

// Membuat koneksi pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'deteksihewanpunah',
});

const createSession = async (userId) => {
  const sessionId = uuidv4();
  const now = new Date();
  const expiredAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Sesi berlaku 24 jam

  await pool.query('INSERT INTO sessions (session_id, user_id, expired_at) VALUES (?, ?, ?)', [
    sessionId,
    userId,
    expiredAt,
  ]);

  return sessionId;
};

const destroySession = async (sessionId) => {
  await pool.query('DELETE FROM sessions WHERE session_id = ?', [sessionId]);
};

module.exports = { pool, createSession, destroySession };
