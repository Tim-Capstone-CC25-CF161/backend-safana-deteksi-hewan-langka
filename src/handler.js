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

const getArticlesHandler = async (request, h) => {
    try {
      const [rows] = await pool.query('SELECT * FROM artikel');
      return h.response(rows).code(200);
    } catch (error) {
      console.error('Error fetching articles:', error);
      return h.response({ message: 'Internal Server Error' }).code(500);
    }
  };
  
  // Get article by id
  const getArticleByIdHandler = async (request, h) => {
    const { id } = request.params;
    try {
      const [rows] = await pool.query('SELECT * FROM artikel WHERE id = ?', [id]);
      if (rows.length === 0) {
        return h.response({ message: 'Article not found' }).code(404);
      }
      return h.response(rows[0]).code(200);
    } catch (error) {
      console.error('Error fetching article:', error);
      return h.response({ message: 'Internal Server Error' }).code(500);
    }
  };
  
  // Create a new article
  const createArticleHandler = async (request, h) => {
    const { title, content, imageUrl, category } = request.payload;
    try {
      const [result] = await pool.query(
        'INSERT INTO artikel (title, content, imageUrl, category) VALUES (?, ?, ?, ?)',
        [title, content, imageUrl, category]
      );
      return h.response({ message: 'Article created', id: result.insertId }).code(201);
    } catch (error) {
      console.error('Error creating article:', error);
      return h.response({ message: 'Internal Server Error' }).code(500);
    }
  };
  
  // Update an article
  const updateArticleHandler = async (request, h) => {
    const { id } = request.params;
    const { title, content, imageUrl, category } = request.payload;
  
    try {
      const [result] = await pool.query(
        'UPDATE artikel SET title = ?, content = ?, imageUrl = ?, category = ? WHERE id = ?',
        [title, content, imageUrl, category, id]
      );
      if (result.affectedRows === 0) {
        return h.response({ message: 'Article not found' }).code(404);
      }
      return h.response({ message: 'Article updated' }).code(200);
    } catch (error) {
      console.error('Error updating article:', error);
      return h.response({ message: 'Internal Server Error' }).code(500);
    }
  };
  
  // Delete an article
  const deleteArticleHandler = async (request, h) => {
    const { id } = request.params;
    try {
      const [result] = await pool.query('DELETE FROM artikel WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return h.response({ message: 'Article not found' }).code(404);
      }
      return h.response({ message: 'Article deleted' }).code(200);
    } catch (error) {
      console.error('Error deleting article:', error);
      return h.response({ message: 'Internal Server Error' }).code(500);
    }
  };
  
module.exports = {
  loginHandler,
  logoutHandler,
  getUsersHandler,
  getArticlesHandler,
  getArticleByIdHandler,
  createArticleHandler,
  updateArticleHandler,
  deleteArticleHandler
};
// module.exports = { loginHandler, logoutHandler, getUsersHandler };
