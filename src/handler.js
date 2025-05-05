const pool = require('./db');

const getUsersHandler = async (request, h) => {
    const { id } = request.params;
    try {
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
module.exports = { getUsersHandler };