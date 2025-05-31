// src/handler/hewanserupaHandler.js

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); 
const { pool } = require('../db');


async function executeQuery(sql, params = []) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
}


const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'hewanserupa');


if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Direktori upload untuk hewanserupa dibuat: ${UPLOAD_DIR}`);
}


// --- Handler untuk Membuat Data Hewan Serupa (Create) ---
const createHewanSerupaHandler = async (request, h) => {
  try {
    const { idHewanAsli, name, namaLatin } = request.payload;
    const { image } = request.payload; // File gambar

    // Validasi input wajib
    if (!idHewanAsli || !name || !namaLatin || !image) {
      return h.response({ status: 'fail', message: 'Semua field (idHewanAsli, name, namaLatin, image) wajib diisi.' }).code(400);
    }

    // Validasi file gambar
    if (!image.hapi || !image._data) {
      return h.response({ status: 'fail', message: 'File gambar tidak valid.' }).code(400);
    }

    // Simpan gambar ke folder upload permanen
    const filename = `${uuidv4()}_${image.hapi.filename}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Tulis data buffer ke file
    await fs.promises.writeFile(filePath, image._data); // Menggunakan fs.promises
    const imageUrl = `/uploads/hewanserupa/${filename}`; // URL relatif untuk database

    // Insert data ke database
    const sql = 'INSERT INTO hewanserupa (idHewanAsli, name, namaLatin, imageUrl) VALUES (?, ?, ?, ?)';
    const params = [idHewanAsli, name, namaLatin, imageUrl];
    const result = await executeQuery(sql, params);

    return h.response({
      status: 'success',
      message: 'Data hewan serupa berhasil ditambahkan.',
      data: {
        id: result.insertId,
        idHewanAsli,
        name,
        namaLatin,
        imageUrl
      }
    }).code(201);

  } catch (error) {
    console.error('Error creating hewan serupa:', error);
    return h.response({ status: 'error', message: 'Terjadi kesalahan server saat membuat data hewan serupa.', details: error.message }).code(500);
  }
};


// --- Handler untuk Membaca Semua Data Hewan Serupa (Read All) ---
const getAllHewanSerupaHandler = async (request, h) => {
  try {
    const sql = 'SELECT id, idHewanAsli, name, namaLatin, imageUrl FROM hewanserupa';
    const rows = await executeQuery(sql);

    return h.response({
      status: 'success',
      message: 'Data hewan serupa berhasil diambil.',
      data: rows
    }).code(200);

  } catch (error) {
    console.error('Error fetching all hewan serupa:', error);
    return h.response({ status: 'error', message: 'Terjadi kesalahan server saat mengambil semua data hewan serupa.', details: error.message }).code(500);
  }
};


// --- Handler untuk Membaca Data Hewan Serupa Berdasarkan ID (Read One) ---
const getHewanSerupaByIdHandler = async (request, h) => {
  try {
    const { id } = request.params; // Ambil ID dari URL parameter

    if (!id) {
      return h.response({ status: 'fail', message: 'ID hewan serupa wajib disediakan.' }).code(400);
    }

    const sql = 'SELECT id, idHewanAsli, name, namaLatin, imageUrl FROM hewanserupa WHERE id = ?';
    const rows = await executeQuery(sql, [id]);

    if (rows.length === 0) {
      return h.response({ status: 'fail', message: 'Data hewan serupa tidak ditemukan.' }).code(404);
    }

    return h.response({
      status: 'success',
      message: 'Data hewan serupa berhasil diambil.',
      data: rows[0] // Karena hanya satu data yang diharapkan
    }).code(200);

  } catch (error) {
    console.error('Error fetching hewan serupa by ID:', error);
    return h.response({ status: 'error', message: 'Terjadi kesalahan server saat mengambil data hewan serupa.', details: error.message }).code(500);
  }
};
const getHewanSerupaByIdAsliHandler = async (request, h) => {
  try {
    const { id } = request.params; // Ambil ID dari URL parameter

    if (!id) {
      return h.response({ status: 'fail', message: 'ID hewan serupa wajib disediakan.' }).code(400);
    }

    const sql = 'SELECT id, idHewanAsli, name, namaLatin, imageUrl FROM hewanserupa WHERE idHewanAsli = ?';
    const rows = await executeQuery(sql, [id]);

    if (rows.length === 0) {
      return h.response({ status: 'fail', message: 'Data hewan serupa tidak ditemukan.' }).code(404);
    }

    return h.response({
      status: 'success',
      message: 'Data hewan serupa berhasil diambil.',
      data: rows
    }).code(200);

  } catch (error) {
    console.error('Error fetching hewan serupa by ID:', error);
    return h.response({ status: 'error', message: 'Terjadi kesalahan server saat mengambil data hewan serupa.', details: error.message }).code(500);
  }
};


// --- Handler untuk Memperbarui Data Hewan Serupa (Update) ---
const updateHewanSerupaHandler = async (request, h) => {
  try {
    const { id } = request.params; // ID data yang akan diperbarui
    const { idHewanAsli, name, namaLatin } = request.payload;
    const { image } = request.payload; // File gambar baru (opsional)

    if (!id) {
      return h.response({ status: 'fail', message: 'ID hewan serupa wajib disediakan.' }).code(400);
    }

    let imageUrl = null;
    let oldImageUrl = null; // Untuk menghapus gambar lama jika ada

    // Dapatkan data lama untuk menghapus gambar lama jika ada gambar baru diupload
    const getOldDataSql = 'SELECT imageUrl FROM hewanserupa WHERE id = ?';
    const oldRows = await executeQuery(getOldDataSql, [id]);

    if (oldRows.length === 0) {
      return h.response({ status: 'fail', message: 'Data hewan serupa tidak ditemukan.' }).code(404);
    }
    oldImageUrl = oldRows[0].imageUrl;


    if (image && image.hapi && image._data) {
      // Jika ada gambar baru diupload, simpan gambar baru
      const filename = `${uuidv4()}_${image.hapi.filename}`;
      const filePath = path.join(UPLOAD_DIR, filename);
      await fs.promises.writeFile(filePath, image._data);
      imageUrl = `/uploads/hewanserupa/${filename}`;

      // Hapus gambar lama jika ada dan valid
      if (oldImageUrl && oldImageUrl.startsWith('/uploads/hewanserupa/')) {
        const oldFilename = path.basename(oldImageUrl);
        const oldFilePath = path.join(UPLOAD_DIR, oldFilename);
        if (fs.existsSync(oldFilePath)) {
          await fs.promises.unlink(oldFilePath); // Hapus file lama
          console.log(`Gambar lama dihapus: ${oldFilePath}`);
        }
      }
    } else if (image === null) {
      // Jika payload mengirim image: null, berarti ingin menghapus gambar
      imageUrl = null; // Set imageUrl di DB menjadi NULL
      if (oldImageUrl && oldImageUrl.startsWith('/uploads/hewanserupa/')) {
        const oldFilename = path.basename(oldImageUrl);
        const oldFilePath = path.join(UPLOAD_DIR, oldFilename);
        if (fs.existsSync(oldFilePath)) {
          await fs.promises.unlink(oldFilePath); // Hapus file lama
          console.log(`Gambar lama dihapus: ${oldFilePath} (melalui set image: null)`);
        }
      }
    } else {
      // Jika tidak ada gambar baru atau image tidak null, gunakan gambar lama
      imageUrl = oldImageUrl;
    }

    // Persiapkan query update dinamis
    let updateFields = [];
    let updateParams = [];

    if (idHewanAsli !== undefined) { updateFields.push('idHewanAsli = ?'); updateParams.push(idHewanAsli); }
    if (name !== undefined) { updateFields.push('name = ?'); updateParams.push(name); }
    if (namaLatin !== undefined) { updateFields.push('namaLatin = ?'); updateParams.push(namaLatin); }
    if (imageUrl !== undefined) { updateFields.push('imageUrl = ?'); updateParams.push(imageUrl); } // Masukkan imageUrl baru/lama/null

    if (updateFields.length === 0) {
      return h.response({ status: 'fail', message: 'Tidak ada field yang disediakan untuk diperbarui.' }).code(400);
    }

    const sql = `UPDATE hewanserupa SET ${updateFields.join(', ')} WHERE id = ?`;
    const params = [...updateParams, id];
    const result = await executeQuery(sql, params);

    if (result.affectedRows === 0) {
      return h.response({ status: 'fail', message: 'Data hewan serupa tidak ditemukan atau tidak ada perubahan.' }).code(404);
    }

    // Ambil data terbaru setelah update untuk respon
    const updatedData = await executeQuery('SELECT id, idHewanAsli, name, namaLatin, imageUrl FROM hewanserupa WHERE id = ?', [id]);

    return h.response({
      status: 'success',
      message: 'Data hewan serupa berhasil diperbarui.',
      data: updatedData[0]
    }).code(200);

  } catch (error) {
    console.error('Error updating hewan serupa:', error);
    return h.response({ status: 'error', message: 'Terjadi kesalahan server saat memperbarui data hewan serupa.', details: error.message }).code(500);
  }
};


// --- Handler untuk Menghapus Data Hewan Serupa (Delete) ---
const deleteHewanSerupaHandler = async (request, h) => {
  try {
    const { id } = request.params; // Ambil ID dari URL parameter

    if (!id) {
      return h.response({ status: 'fail', message: 'ID hewan serupa wajib disediakan.' }).code(400);
    }

    // Dapatkan URL gambar lama sebelum dihapus dari DB
    const getImageUrlSql = 'SELECT imageUrl FROM hewanserupa WHERE id = ?';
    const rows = await executeQuery(getImageUrlSql, [id]);

    if (rows.length === 0) {
      return h.response({ status: 'fail', message: 'Data hewan serupa tidak ditemukan.' }).code(404);
    }
    const imageUrlToDelete = rows[0].imageUrl;

    // Hapus data dari database
    const sql = 'DELETE FROM hewanserupa WHERE id = ?';
    const result = await executeQuery(sql, [id]);

    if (result.affectedRows === 0) {
      return h.response({ status: 'fail', message: 'Data hewan serupa tidak ditemukan.' }).code(404);
    }

    // Hapus file gambar dari server jika ada
    if (imageUrlToDelete && imageUrlToDelete.startsWith('/uploads/hewanserupa/')) {
      const filename = path.basename(imageUrlToDelete);
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath); // Hapus file
        console.log(`Gambar dihapus dari disk: ${filePath}`);
      }
    }

    return h.response({
      status: 'success',
      message: 'Data hewan serupa berhasil dihapus.'
    }).code(200);

  } catch (error) {
    console.error('Error deleting hewan serupa:', error);
    return h.response({ status: 'error', message: 'Terjadi kesalahan server saat menghapus data hewan serupa.', details: error.message }).code(500);
  }
};


module.exports = {
  createHewanSerupaHandler,
  getAllHewanSerupaHandler,
  getHewanSerupaByIdHandler,
  updateHewanSerupaHandler,
  deleteHewanSerupaHandler,
  getHewanSerupaByIdAsliHandler,
};