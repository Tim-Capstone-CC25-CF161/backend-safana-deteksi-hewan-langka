// src/handler/mapsHandler.js

const { pool } = require('../db'); // Menggunakan pool koneksi database
// Tidak perlu mengimpor library lain yang tidak digunakan di handler ini.

const getMapsHandler = async (request, h) => {
    try {
        // Ambil query parameters untuk pagination
        const page = parseInt(request.query.page) || 1; // Default ke halaman 1
        const per_page = parseInt(request.query.per_page) || 5; // Default 5 data per halaman
        const offset = (page - 1) * per_page;

        // --- 1. Query untuk mendapatkan total data ---
        const [countRows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM detection_histories dh
            JOIN hewandilindungi hd ON dh.hewan_id = hd.id
            JOIN provinsi p ON dh.province_code = p.kode
        `);
        const total_data = countRows[0].total;
        const total_pages = Math.ceil(total_data / per_page);

        // --- 2. Query untuk mendapatkan data dengan pagination dan format sesuai ---
        const [dataRows] = await pool.query(`
            SELECT 
                 dh.*, hd.*,hd.nama AS nama_hewan, p.*
            FROM detection_histories dh
            JOIN hewandilindungi hd ON dh.hewan_id = hd.id
            JOIN provinsi p ON dh.province_code = p.kode
            ORDER BY dh.created_at DESC 
            LIMIT ? OFFSET ?
        `, [per_page, offset]);

        // Format data agar latitude dan longitude menjadi angka
        const formattedData = dataRows.map(row => ({
            ...row,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude)
        }));

        // --- 3. Kembalikan response dalam format yang diinginkan ---
        return h.response({
            status: 'success',
            message: 'Get data successfully',
            data: {
                data: formattedData,
                page: page,
                total_pages: total_pages,
                total_data: total_data,
                per_page: per_page
            }
        }).code(200);

    } catch (error) {
        console.error('Error fetching maps:', error);
        return h.response({
            status: 'error',
            message: 'Internal Server Error',
            details: error.message
        }).code(500);
    }
};

module.exports = {
    getMapsHandler
};