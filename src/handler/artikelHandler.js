const { pool, createSession, destroySession } = require('../db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
  getArticlesHandler,
  getArticleByIdHandler,
  createArticleHandler,
  updateArticleHandler,
  deleteArticleHandler
}
