const { pool, createSession, destroySession } = require("../db");
const bcrypt = require("bcryptjs"); // Consider using bcrypt for password hashing
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// --- GET USERS HANDLER ---
const getUsersHandler = async (request, h) => {
  try {
    // Query untuk mengambil semua pengguna yang TIDAK di-soft delete
    const [rows] = await pool.query("SELECT id, name, username FROM admin WHERE is_deleted = FALSE");
    if (rows.length === 0) {
      return h.response({ message: "No active users found" }).code(404);
    }
    return h.response(rows).code(200);
  } catch (error) {
    console.error("Error fetching active users:", error);
    return h.response({ message: "Internal Server Error" }).code(500);
  }
};

// --- LOGIN HANDLER ---
const loginHandler = async (request, h) => {
  const { username, password } = request.payload;

  const [users] = await pool.query("SELECT * FROM admin WHERE username = ?", [
    username,
  ]);
  const user = users[0];

  // Tambahkan cek is_deleted agar user yang sudah dihapus secara soft tidak bisa login
  if (!user || user.is_deleted || password !== user.password) { // IMPORTANT: Use bcrypt.compare for hashed passwords
    return h.response({ message: "Invalid credentials or account deactivated" }).code(401);
  }

  const sessionId = await createSession(user.id);
  const { password: _, ...userData } = user;

  request.cookieAuth.set({
    ...userData,
    sessionId,
  });

  return h
    .response({
      message: "Login successful",
      data: {
        sid: sessionId,
        ...userData,
      },
    })
    .code(200);
};

// --- LOGOUT HANDLER ---
const logoutHandler = (request, h) => {
  const sessionId = request.state.sessionId;

  destroySession(sessionId);
  request.cookieAuth.clear();

  return h.response({ message: "Logout successful" }).code(200);
};

// --- CREATE ADMIN HANDLER ---
const createAdminHandler = async (request, h) => {
  const { name, username, password } = request.payload;

  // Validasi sederhana
  if (!name || !username || !password) {
    return h
      .response({ message: "Name, username, and password are required" })
      .code(400);
  }

  try {
    // Cek apakah username sudah ada (baik yang aktif maupun yang soft-deleted, agar tidak ada duplikasi)
    const [existing] = await pool.query(
      "SELECT id FROM admin WHERE username = ?",
      [username]
    );
    if (existing.length > 0) {
      return h.response({ message: "Username already exists" }).code(409);
    }

    // Simpan data ke database. Default `is_deleted` harus `FALSE` atau `0` di skema DB.
    // IMPORTANT: Gunakan bcrypt untuk hashing password sebelum menyimpan!
    // const hashedPassword = await bcrypt.hash(password, 10); // contoh hashing
    await pool.query(
      "INSERT INTO admin (name, username, password, is_deleted) VALUES (?, ?, ?, FALSE)", // eksplisit set FALSE
      [name, username, password] // Gunakan hashedPassword jika sudah di-hash
    );

    return h
      .response({
        message: "User created successfully",
        data: {
          name,
          username,
        },
      })
      .code(201);
  } catch (error) {
    console.error("Error creating admin:", error);
    return h.response({ message: "Internal Server Error" }).code(500);
  }
};

// --- UPDATE ADMIN HANDLER ---
const updateAdminHandler = async (request, h) => {
  const { id } = request.params;
  const { name, username, password } = request.payload;

  if (!name && !username && !password) {
    return h
      .response({
        message: "At least one field (name, username, or password) is required for update.",
      })
      .code(400);
  }

  try {
    // Cek apakah admin ada dan belum di-soft delete
    const [adminToUpdate] = await pool.query('SELECT id, is_deleted FROM admin WHERE id = ?', [id]);
    if (adminToUpdate.length === 0) {
        return h.response({ message: 'Admin not found.' }).code(404);
    }
    if (adminToUpdate[0].is_deleted) {
        return h.response({ message: 'Cannot update a soft-deleted admin. Restore the account first.' }).code(403); // Forbidden
    }

    let updateFields = [];
    let queryParams = [];

    if (name) {
      updateFields.push("name = ?");
      queryParams.push(name);
    }
    if (username) {
      // Cek apakah username baru sudah digunakan oleh user lain yang aktif
      const [existingUser] = await pool.query(
        "SELECT id FROM admin WHERE username = ? AND id != ? AND is_deleted = FALSE",
        [username, id]
      );
      if (existingUser.length > 0) {
        return h
          .response({ message: "Username already taken by another active user." })
          .code(409);
      }
      updateFields.push("username = ?");
      queryParams.push(username);
    }
    if (password) {
      // IMPORTANT: Dalam aplikasi nyata, hash password di sini
      // const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password = ?");
      queryParams.push(password); // Gunakan hashedPassword jika sudah di-hash
    }

    if (updateFields.length === 0) {
      return h
        .response({ message: "No valid fields provided for update." })
        .code(400);
    }

    const query = `UPDATE admin SET ${updateFields.join(", ")} WHERE id = ?`;
    queryParams.push(id);

    const [result] = await pool.query(query, queryParams);

    // If affectedRows is 0, it means the ID was found but no data changed (or the user was already soft-deleted, which we've handled)
    if (result.affectedRows === 0) {
      return h
        .response({ message: "Admin found, but no changes were made." })
        .code(200); // Return 200 if no change, as the user might have sent same data
    }

    // Fetch updated data to return in response (optional, but good practice)
    const [updatedAdmin] = await pool.query(
      "SELECT id, name, username FROM admin WHERE id = ?",
      [id]
    );

    return h
      .response({
        message: "Admin updated successfully",
        data: updatedAdmin[0],
      })
      .code(200);
  } catch (error) {
    console.error("Error updating admin:", error);
    return h.response({ message: "Internal Server Error" }).code(500);
  }
};

// --- DELETE ADMIN HANDLER (SOFT DELETE) ---
const deleteAdminHandler = async (request, h) => {
    const { id } = request.params;

    try {
        const [existingAdmin] = await pool.query('SELECT id, is_deleted FROM admin WHERE id = ?', [id]);

        if (existingAdmin.length === 0) {
            return h.response({ message: 'Admin not found.' }).code(404);
        }

        if (existingAdmin[0].is_deleted) {
            return h.response({ message: 'Admin is already soft-deleted.' }).code(409);
        }

        const [result] = await pool.query('UPDATE admin SET is_deleted = TRUE WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return h.response({ message: 'Failed to soft delete admin.' }).code(500);
        }

        return h.response({ message: 'Admin soft-deleted successfully.' }).code(200);

    } catch (error) {
        console.error('Error soft deleting admin:', error);
        return h.response({ message: 'Internal Server Error.' }).code(500);
    }
};

module.exports = {
  loginHandler,
  logoutHandler,
  getUsersHandler,
  createAdminHandler,
  updateAdminHandler,
  deleteAdminHandler,
};