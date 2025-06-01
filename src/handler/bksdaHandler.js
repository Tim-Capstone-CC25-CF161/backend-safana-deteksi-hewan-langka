// src/handler/bksdaHandler.js

const { pool } = require('../db'); // Menggunakan pool koneksi database

// Fungsi helper untuk menjalankan query SQL
async function executeQuery(sql, params = []) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
}

// --- Handler untuk Membaca Semua Data BKSDA (GET All) ---
const getAllBksdaHandler = async (request, h) => {
  try {
    const [rows] = await pool.query(`
        SELECT 
            id,
            nama,
            kode_provinsi,
            nomor_wa,
            longtitude,
            latitude
        FROM bksda
    `); // Pastikan nama tabel 'bksda' sesuai dengan DB Anda

    if (rows.length === 0) {
      return h.response({ 
        status: 'success', 
        message: 'No BKSDA data found',
        data: [] // Kembalikan array kosong jika tidak ada data
      }).code(200);
    }

    // Format longtitude dan latitude menjadi angka
    const formattedData = rows.map(row => ({
        ...row,
        longtitude: parseFloat(row.longtitude),
        latitud: parseFloat(row.latitud) // Perhatikan nama kolom 'latitud'
    }));

    return h.response({
      status: 'success',
      message: 'BKSDA data retrieved successfully',
      data: formattedData
    }).code(200);

  } catch (error) {
    console.error('Error fetching all BKSDA data:', error);
    return h.response({ 
      status: 'error', 
      message: 'Internal Server Error', 
      details: error.message 
    }).code(500);
  }
};


// --- Handler untuk Membaca Data BKSDA Berdasarkan ID (GET by ID) ---
const getBksdaByIdHandler = async (request, h) => {
  try {
    const { id } = request.params; // Ambil ID dari URL parameter

    if (!id) {
      return h.response({ status: 'fail', message: 'BKSDA ID is required.' }).code(400);
    }

    const [rows] = await pool.query(`
        SELECT 
            id,
            nama,
            kode_provinsi,
            nomor_wa,
            longtitude,
            latitude
        FROM bksda
        WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return h.response({ status: 'fail', message: 'BKSDA data not found.' }).code(404);
    }

    // Format longtitude dan latitude menjadi angka untuk single data
    const formattedData = {
        ...rows[0],
        longtitude: parseFloat(rows[0].longtitude),
        latitud: parseFloat(rows[0].latitud)
    };

    return h.response({
      status: 'success',
      message: 'BKSDA data retrieved successfully',
      data: formattedData
    }).code(200);

  } catch (error) {
    console.error('Error fetching BKSDA data by ID:', error);
    return h.response({ 
      status: 'error', 
      message: 'Internal Server Error', 
      details: error.message 
    }).code(500);
  }
};


module.exports = {
  getAllBksdaHandler,
  getBksdaByIdHandler,
};