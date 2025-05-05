// src/handler.js
const { pool, createSession, destroySession } = require('./db');
const bcrypt = require('bcryptjs');

const getUsersHandler = async (request, h) => {
  try {
    // Query untuk mengambil semua pengguna
    const [rows] = await pool.query('SELECT * FROM admin');
    if (rows.length === 0) {
      return h.response({ message: 'User not found' }).code(404);
    }
    return h.response(rows).code(200);
  } catch (error) {
    console.error('Error fetching user:', error);
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};

const loginHandler = async (request, h) => {
  const { username, password } = request.payload;

  // Query untuk mendapatkan data pengguna berdasarkan username
  const [users] = await pool.query('SELECT * FROM admin WHERE username = ?', [username]);
  const user = users[0];

//   if (!user || !(await bcrypt.compare(password, user.password))) {
//     return h.response({ message: 'Invalid credentials' }).code(401);
//   }
  if (!user || password !== user.password) {
    return h.response({ message: 'Invalid credentials' }).code(401);
  }
  
  const sessionId = await createSession(user.id);
  request.cookieAuth.set({ userId: user.id, sessionId });

  return h.response({ message: 'Login successful' }).code(200);
};

const logoutHandler = (request, h) => {
  const sessionId = request.state.sessionId;

  destroySession(sessionId);
  request.cookieAuth.clear();

  return h.response({ message: 'Logout successful' }).code(200);
};

module.exports = { loginHandler, logoutHandler, getUsersHandler };
