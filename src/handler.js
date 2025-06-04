// src/handler.js
const { pool, createSession, destroySession } = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// const getUsersHandler = async (request, h) => {
//   try {
//     // Query untuk mengambil semua pengguna
//     const [rows] = await pool.query('SELECT * FROM admin');
//     if (rows.length === 0) {
//       return h.response({ message: 'User not found' }).code(404);
//     }
//     return h.response(rows).code(200);
//   } catch (error) {
//     console.error('Error fetching user:', error);
//     return h.response({ message: 'Internal Server Error' }).code(500);
//   }
// };
// const loginHandler = async (request, h) => {
//   const { username, password } = request.payload;

//   const [users] = await pool.query('SELECT * FROM admin WHERE username = ?', [username]);
//   const user = users[0];

//   if (!user || password !== user.password) {
//     return h.response({ message: 'Invalid credentials' }).code(401);
//   }

//   const sessionId = await createSession(user.id);
//   const { password: _, ...userData } = user; 

//   request.cookieAuth.set({
//     ...userData,
//     sessionId
//   });

//   return h.response({
//     message: 'Login successful',
//     data: {
//       sid: sessionId,
//       ...userData
//     }
//   }).code(200);
// };

// const logoutHandler = (request, h) => {
//   const sessionId = request.state.sessionId;

//   destroySession(sessionId);
//   request.cookieAuth.clear();

//   return h.response({ message: 'Logout successful' }).code(200);
// };

// const createAdminHandler = async (request, h) => {
//   const { name, username, password } = request.payload;

//   // Validasi sederhana
//   if (!name || !username || !password) {
//     return h.response({ message: 'Name, username, and password are required' }).code(400);
//   }

//   try {
//     // Cek apakah username sudah ada
//     const [existing] = await pool.query('SELECT * FROM admin WHERE username = ?', [username]);
//     if (existing.length > 0) {
//       return h.response({ message: 'Username already exists' }).code(409);
//     }

//     // Simpan data ke database (opsional: hashing password jika diperlukan)
//     await pool.query('INSERT INTO admin (name, username, password) VALUES (?, ?, ?)', [
//       name, username, password, 
//     ]);

//     return h.response({ message: 'User created successfully',data: {
//         name,
//         username
//       } }).code(201);
//   } catch (error) {
//     console.error('Error creating admin:', error);
//     return h.response({ message: 'Internal Server Error' }).code(500);
//   }
// };

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
  

// endpoint untuk table hewandilindungi
// Get all hewan dilindungi
const getHewanHandler = async (request, h) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hewandilindungi');
    return h.response(rows).code(200);
  } catch (error) {
    console.error('Error fetching hewan:', error);
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};

// Get hewan dilindungi by ID
const getHewanByIdHandler = async (request, h) => {
  const { id } = request.params;
  try {
    const [rows] = await pool.query('SELECT * FROM hewandilindungi WHERE id = ?', [id]);
    if (rows.length === 0) {
      return h.response({ message: 'Hewan not found' }).code(404);
    }
    return h.response(rows[0]).code(200);
  } catch (error) {
    console.error('Error fetching hewan by id:', error);
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};

// Create new hewan dilindungi
const createHewanHandler = async (request, h) => {
  const { nama, namaLatin, populasi, endangeredStatus } = request.payload;
  try {
    await pool.query(
      'INSERT INTO hewandilindungi (nama, namaLatin, populasi, endangeredStatus) VALUES (?, ?, ?, ?)',
      [nama, namaLatin, populasi, endangeredStatus]
    );
    return h.response({ message: 'Hewan created successfully' }).code(201);
  } catch (error) {
    console.error('Error creating hewan:', error);
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};

// Update hewan dilindungi
const updateHewanHandler = async (request, h) => {
  const { id } = request.params;
  const { nama, namaLatin, populasi, endangeredStatus } = request.payload;
  try {
    await pool.query(
      'UPDATE hewandilindungi SET nama = ?, namaLatin = ?, populasi = ?, endangeredStatus = ? WHERE id = ?',
      [nama, namaLatin, populasi, endangeredStatus, id]
    );
    return h.response({ message: 'Hewan updated successfully', data:{nama, namaLatin,endangeredStatus,id}}).code(200);
  } catch (error) {
    console.error('Error updating hewan:', error);
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};

// Delete hewan dilindungi
const deleteHewanHandler = async (request, h) => {
  const { id } = request.params;
  try {
    await pool.query('DELETE FROM hewandilindungi WHERE id = ?', [id]);
    return h.response({ message: 'Hewan deleted successfully' }).code(200);
  } catch (error) {
    console.error('Error deleting hewan:', error);
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};





// endpoint untuk table endangeredimage
const createImageEndangered = async (request, h) => {
  const { idHewan } = request.payload;
  const { image } = request.payload;

  if (!image || !image.hapi || !image._data) {
    return h.response({ message: 'No image file uploaded' }).code(400);
  }

  try {
    const filename = `${uuidv4()}_${image.hapi.filename}`;
    const uploadPath = path.join(__dirname, '../uploads', filename);
    const fileStream = fs.createWriteStream(uploadPath);

    fileStream.write(image._data);
    fileStream.end();

    const imageUrl = `/uploads/${filename}`; // relative URL

    await pool.query(
      'INSERT INTO endangeredimage (idHewan, imageUrl) VALUES (?, ?)',
      [idHewan, imageUrl]
    );

    return h.response({ message: 'Image uploaded successfully', imageUrl }).code(201);
  } catch (error) {
    console.error('Error uploading image:', error);
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};

// GET semua gambar
// const getAllImagesEndangered = async (request, h) => {
//   try {
//     const [rows] = await pool.query('SELECT * FROM endangeredimage');
//     return h.response(rows).code(200);
//   } catch (err) {
//     console.error(err);
//     return h.response({ message: 'Internal Server Error' }).code(500);
//   }
// };
const getAllImagesEndangered = async (request, h) => {
  try {
    const user = request.auth.credentials; 

    console.log("Session user:", user); 

    const [rows] = await pool.query('SELECT * FROM endangeredimage');
    return h.response({
      message: 'Data fetched successfully',
      user,
      data: rows
    }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};

// GET gambar by ID
const getImageByIdEndangered = async (request, h) => {
  const { id } = request.params;
  try {
    const [rows] = await pool.query('SELECT * FROM endangeredimage WHERE id = ?', [id]);
    if (rows.length === 0) {
      return h.response({ message: 'Image not found' }).code(404);
    }
    return h.response(rows[0]).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};

// PUT (update gambar dan/atau idHewan)
const updateImageEndangered = async (request, h) => {
  const { id } = request.params;
  const { idHewan } = request.payload;
  const file = request.payload.image;

  try {
    const [rows] = await pool.query('SELECT * FROM endangeredimage WHERE id = ?', [id]);
    if (rows.length === 0) {
      return h.response({ message: 'Image not found' }).code(404);
    }

    const oldImagePath = path.join(__dirname, '../uploads', path.basename(rows[0].imageUrl));
    if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);

    const filename = `${uuidv4()}_${file.hapi.filename}`;
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    const fileStream = fs.createWriteStream(filePath);

    await new Promise((resolve, reject) => {
      file.pipe(fileStream);
      file.on('end', resolve);
      file.on('error', reject);
    });

    const imageUrl = `/uploads/${filename}`;
    await pool.query('UPDATE endangeredimage SET idHewan = ?, imageUrl = ? WHERE id = ?', [idHewan, imageUrl, id]);

    return h.response({ message: 'Image updated successfully' }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};

// DELETE gambar
const deleteImageEndangered = async (request, h) => {
  const { id } = request.params;

  try {
    const [rows] = await pool.query('SELECT * FROM endangeredimage WHERE id = ?', [id]);
    if (rows.length === 0) {
      return h.response({ message: 'Image not found' }).code(404);
    }

    const imagePath = path.join(__dirname, '../uploads', path.basename(rows[0].imageUrl));
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    await pool.query('DELETE FROM endangeredimage WHERE id = ?', [id]);

    return h.response({ message: 'Image deleted successfully' }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: 'Internal Server Error' }).code(500);
  }
};
  //crud provinsi -----------------------------------------------------------------
  const createProvinsiHandler = async (request, h) => {
  const { nama, kode, meta } = request.payload;
  try {
    const [result] = await pool.query(
      'INSERT INTO provinsi (nama, kode, meta) VALUES (?, ?, ?)',
      [nama, kode, meta]
    );
    return h.response({ message: 'Provinsi created', id: result.insertId }).code(201);
  } catch (err) {
    console.error(err);
    return h.response({ message: 'Failed to create provinsi' }).code(500);
  }
};

const getAllProvinsiHandler = async (request, h) => {
  try {
    const [rows] = await pool.query('SELECT * FROM provinsi');
    return h.response(rows).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: 'Failed to fetch provinsi' }).code(500);
  }
};

const getProvinsiByIdHandler = async (request, h) => {
  const { id } = request.params;
  try {
    const [rows] = await pool.query('SELECT * FROM provinsi WHERE id = ?', [id]);
    if (rows.length === 0) {
      return h.response({ message: 'Provinsi not found' }).code(404);
    }
    return h.response(rows[0]).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: 'Error fetching provinsi' }).code(500);
  }
};

const updateProvinsiHandler = async (request, h) => {
  const { id } = request.params;
  const { nama, kode, meta } = request.payload;
  try {
    const [result] = await pool.query(
      'UPDATE provinsi SET nama = ?, kode = ?, meta = ? WHERE id = ?',
      [nama, kode, meta, id]
    );
    if (result.affectedRows === 0) {
      return h.response({ message: 'Provinsi not found' }).code(404);
    }
    return h.response({ message: 'Provinsi updated' }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: 'Failed to update provinsi' }).code(500);
  }
};

const deleteProvinsiHandler = async (request, h) => {
  const { id } = request.params;
  try {
    const [result] = await pool.query('DELETE FROM provinsi WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return h.response({ message: 'Provinsi not found' }).code(404);
    }
    return h.response({ message: 'Provinsi deleted' }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: 'Failed to delete provinsi' }).code(500);
  }
};
//BKSDA ---------------------------------------------------------------------------
const createBksdaHandler = async (request, h) => {
  const { nama, kode_provinsi, nomor_wa } = request.payload;
  try {
    const [result] = await pool.query(
      'INSERT INTO bksda (nama, kode_provinsi, nomor_wa) VALUES (?, ?, ?)',
      [nama, kode_provinsi, nomor_wa]
    );
    return h.response({ message: 'BKSDA created', data:{id: result.insertId, nama, kode_provinsi,nomor_wa} }).code(201);
  } catch (err) {
    console.error(err);
    return h.response({ message: 'Failed to create BKSDA' }).code(500);
  }
};

module.exports = {
  //auth
  // loginHandler,
  // logoutHandler,
  // getUsersHandler,
  // createAdminHandler,
  //artikel
  
  //hewan dilindungi
  getHewanHandler,
  getHewanByIdHandler,
  createHewanHandler,
  updateHewanHandler,
  deleteHewanHandler,
  //endangered image
  createImageEndangered,
  getAllImagesEndangered,
  getImageByIdEndangered,
  updateImageEndangered,
  deleteImageEndangered,
  //provinsi
  createProvinsiHandler,
  getAllProvinsiHandler,
  getProvinsiByIdHandler,
  updateProvinsiHandler,
  deleteProvinsiHandler,
  //BKSDA handler
  createBksdaHandler
};
// module.exports = { loginHandler, logoutHandler, getUsersHandler };
