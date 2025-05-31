// --- File: src/handler/predictHandler.js ---

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");
const node_fetch = require('node-fetch');

const { pool, createSession, destroySession } = require('../db'); 

const NOMINATIM_USER_AGENT = 'WildlifePredictionApp/1.0 (contact@yourapp.com)'; 

const classLabels = [
  "anoa",
  "babirusa",
  "biawak_pohon_biru",
  "harimau_sumatera",
  "jalak_bali",
  "kakatua_jambul_kuning",
  "kera_hitam",
  "orangutan",
  "owa_jawa",
  "rusa_bawean",
  "siamang"
];

let modelPromise;

async function loadModel() {
  if (!modelPromise) {
    modelPromise = tf.loadGraphModel("file://model/model.json");
    console.log("Memuat model TensorFlow.js...");
  }
  return await modelPromise;
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function softmax(arr) {
  const max = Math.max(...arr);
  const exps = arr.map(x => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

function iou(box1, box2) {
  const [x1, y1, x2, y2] = box1;
  const [x1b, y1b, x2b, y2b] = box2;

  const xi1 = Math.max(x1, x1b);
  const yi1 = Math.max(y1, y1b);
  const xi2 = Math.min(x2, x2b);
  const yi2 = Math.min(y2, y2b); 
  const interArea = Math.max(xi2 - xi1, 0) * Math.max(yi2 - yi1, 0);

  const box1Area = (x2 - x1) * (y2 - y1);
  const box2Area = (x2b - x1b) * (y2b - y1b);
  const unionArea = box1Area + box2Area - interArea;

  return interArea / unionArea;
}

function nms(boxes, scores, iouThreshold = 0.45) {
  const picked = [];
  const indexes = scores
    .map((score, idx) => [score, idx])
    .sort((a, b) => b[0] - a[0])
    .map(([, idx]) => idx);

  while (indexes.length > 0) {
    const current = indexes.shift();
    picked.push(current);

    const filtered = [];
    for (const idx of indexes) {
      const iouVal = iou(boxes[current], boxes[idx]);
      if (iouVal < iouThreshold) {
        filtered.push(idx);
      }
    }

    indexes.splice(0, indexes.length, ...filtered);
  }

  return picked;
}

async function executeQuery(sql, params = []) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
}

async function getProvinceFromCoordinates(latitude, longitude) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    const res = await node_fetch(url, {
      headers: {
        'User-Agent': NOMINATIM_USER_AGENT
      }
    });
    const data = await res.json();
    
    return data.address.state || data.address.region || null; 
  } catch (error) {
    console.error("Error getting province from coordinates (Nominatim):", error.message);
    return null;
  }
}

async function getProvinceCodeId(provinceName) {
  if (!provinceName) return null;
  console.log(`Mencari ID province_code untuk nama provinsi: ${provinceName}`);
  try {
    const rows = await executeQuery('SELECT kode FROM provinsi WHERE nama = ? LIMIT 1', [provinceName]); 
    return rows.length > 0 ? rows[0].kode : null; 
  } catch (error) {
    console.error("Error getting province_code ID:", error.message);
    return null;
  }
}

async function getHewanId(className) {
  if (!className) return null;
  console.log(`Mencari ID hewan untuk nama kelas: ${className}`);
  try {
    const rows = await executeQuery('SELECT id FROM hewandilindungi WHERE nama = ? LIMIT 1', [className]);
    return rows.length > 0 ? rows[0].id : null; 
  } catch (error) {
    console.error("Error getting hewan ID:", error.message);
    return null;
  }
}


const PredictHandler = async (request, h) => {
  let imageTensor = null;
  let predictionsTensor = null;
  let tempFilePath = null; 
  let permanentUploadPath = null; 

  try {
    const { file, latitude, longitude, user_id } = request.payload; 

    if (!file || !file.hapi || !file._data) {
      return h.response({ status: "fail", message: "File gambar tidak ditemukan di request" }).code(400);
    }
    if (typeof latitude === 'undefined' || typeof longitude === 'undefined' || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
        return h.response({ status: "fail", message: "Latitude dan Longitude harus disediakan dan berupa angka yang valid" }).code(400);
    }

    tempFilePath = path.join(os.tmpdir(), uuidv4() + path.extname(file.hapi.filename));
    const fileStreamTemp = fs.createWriteStream(tempFilePath);
    await new Promise((resolve, reject) => {
      fileStreamTemp.write(file._data); 
      fileStreamTemp.end();
      fileStreamTemp.on("finish", resolve);
      fileStreamTemp.on("error", reject);
    });

    const imageBuffer = fs.readFileSync(tempFilePath);
    imageTensor = tf.node
      .decodeImage(imageBuffer, 3)
      .resizeBilinear([640, 640])
      .div(255.0)
      .transpose([2, 0, 1])
      .expandDims(0);

    console.log("Input tensor shape (after transpose):", imageTensor.shape);

    const model = await loadModel();
    predictionsTensor = await model.executeAsync(imageTensor);

    const rawOutputData = predictionsTensor.arraySync();

    const attributes = predictionsTensor.shape[1];
    const numBoxes = predictionsTensor.shape[2];

    const reshapedPredictions = new Array(numBoxes);
    for (let i = 0; i < numBoxes; i++) {
      reshapedPredictions[i] = new Float32Array(attributes);
      for (let j = 0; j < attributes; j++) {
        reshapedPredictions[i][j] = rawOutputData[0][j][i];
      }
    }

    let bestDetection = null;
    let maxOverallScore = -1;

    for (let i = 0; i < numBoxes; i++) {
      const boxData = reshapedPredictions[i];

      const cx = boxData[0];
      const cy = boxData[1];
      const w = boxData[2];
      const h = boxData[3];
      
      const rawObjScore = boxData[4]; 

      const classScoresRaw = Array.from(boxData).slice(5); 
      const classProbabilities = softmax(classScoresRaw); 

      const maxClassScore = Math.max(...classProbabilities);
      const classIndex = classProbabilities.indexOf(maxClassScore);
      
      const effectiveObjScore = (rawObjScore > 0.0001) ? rawObjScore : maxClassScore; 
      const finalScore = effectiveObjScore * maxClassScore; 

      const x1 = Math.max(cx - w / 2, 0);
      const y1 = Math.max(cy - h / 2, 0);
      const x2 = Math.min(cx + w / 2, 640);
      const y2 = Math.min(cy + h / 2, 640);

      const currentDetection = {
        bbox: [x1, y1, x2, y2],
        score: parseFloat(finalScore.toFixed(4)), 
        class: classLabels[classIndex] || `class-${classIndex}`,
      };

      if (currentDetection.score > maxOverallScore) {
          maxOverallScore = currentDetection.score;
          bestDetection = currentDetection;
      }
    }

    console.log(`Jumlah total prediksi yang diproses: ${numBoxes}`); 

    let finalDetectedResult = null;
    if (bestDetection && bestDetection.score > 0) { 
        finalDetectedResult = bestDetection;
        console.log(`Deteksi terbaik (di luar threshold): Class: ${bestDetection.class}, Score: ${bestDetection.score}, BBox: ${bestDetection.bbox}`);
    } else {
        console.log("Tidak ada deteksi yang memiliki skor final > 0 setelah akal-akalan.");
    }
    
    // --- Data untuk disimpan ke Database (detection_histories & endangeredimage) ---
    let imageUrl = null;
    let insertedEndangeredImageId = null;
    let detectedHewanId = null; // Menyimpan hewan_id yang terdeteksi
    let detectedProvinceCode = null; // Menyimpan kode provinsi
    let detectedProvinceName = null; // Menyimpan nama provinsi

    // Hanya simpan gambar ke folder uploads jika ada deteksi terbaik DAN hewan_id ditemukan
    if (finalDetectedResult && finalDetectedResult.class) {
        detectedHewanId = await getHewanId(finalDetectedResult.class);
        
        if (detectedHewanId !== null) {
            const filename = `${uuidv4()}_${file.hapi.filename}`;
            permanentUploadPath = path.join(fs.realpathSync('.'), 'uploads', filename); 
            
            const uploadDir = path.dirname(permanentUploadPath);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log(`Folder 'uploads' dibuat di: ${uploadDir}`);
            }

            fs.copyFileSync(tempFilePath, permanentUploadPath);
            console.log(`File gambar berhasil diupload ke: ${permanentUploadPath}`);

            imageUrl = `/uploads/${filename}`; 

            const insertEndangeredImageSql = 'INSERT INTO endangeredimage (idHewan, imageUrl) VALUES (?, ?)';
            const insertEndangeredImageParams = [detectedHewanId, imageUrl];
            const endangeredImageResult = await executeQuery(insertEndangeredImageSql, insertEndangeredImageParams);
            insertedEndangeredImageId = endangeredImageResult.insertId;
            console.log(`Data endangeredimage berhasil disimpan dengan ID: ${insertedEndangeredImageId}`);
        } else {
            console.log(`Hewan ID untuk ${finalDetectedResult.class} tidak ditemukan, tidak menyimpan ke endangeredimage.`);
        }
    } else {
      console.log("Tidak ada deteksi terbaik untuk menyimpan gambar ke folder uploads atau endangeredimage.");
    }

    // Mendapatkan nama provinsi dari koordinat
    detectedProvinceName = await getProvinceFromCoordinates(latitude, longitude);
    console.log(`Province Name from Nominatim: ${detectedProvinceName}`); 
    if (detectedProvinceName) {
        detectedProvinceCode = await getProvinceCodeId(detectedProvinceName);
        console.log(`Provinsi: ${detectedProvinceName}, Province Code ID: ${detectedProvinceCode}`);
    }
    
    // --- Data untuk disimpan ke table detection_histories ---
    const sql = `INSERT INTO detection_histories (image, address, latitude, longitude, province_code, hewan_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        imageUrl, // Menggunakan imageUrl dari proses upload
        detectedProvinceName, // Nama provinsi sebagai address
        parseFloat(latitude),
        parseFloat(longitude),
        detectedProvinceCode, // Kode provinsi
        detectedHewanId, // ID hewan dari deteksi
        user_id ? parseInt(user_id) : null // User ID dari payload
    ];
    const insertResult = await executeQuery(sql, params);
    const insertedDetectionHistoryId = insertResult.insertId; 

    console.log(`Data detection_histories berhasil disimpan dengan ID: ${insertedDetectionHistoryId}`);
    
    return h.response({
      status: "success",
      message: "Prediction and data saved successfully",
      data: finalDetectedResult, 
      // --- Tambahan data sesuai permintaan ---
      province_code: detectedProvinceCode,
      user_id: user_id ? parseInt(user_id) : null, // user_id dari input payload
      province_name: detectedProvinceName,
      // --- Akhir tambahan data ---
      db_entry_id: insertedDetectionHistoryId,
      uploaded_image_id: insertedEndangeredImageId,
      uploaded_image_url: imageUrl,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    }).code(200);

  } catch (err) {
    console.error("Prediction error:", err);
    if (err.tfMessage) {
        console.error("TensorFlow.js error message:", err.tfMessage);
    }
    return h.response({ 
        status: "fail", 
        message: "Terjadi kesalahan saat prediksi atau penyimpanan data", 
        error: err.message,
        details: err.stack 
    }).code(500);
  } finally {
    if (imageTensor) imageTensor.dispose();
    if (predictionsTensor && predictionsTensor.isDisposed === false) {
        try {
            predictionsTensor.dispose();
        } catch (disposeErr) {
            console.error("Error disposing predictionsTensor in finally block:", disposeErr);
        }
    }
    if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
            fs.unlinkSync(tempFilePath);
        } catch (unlinkErr) {
            console.error("Failed to delete temp file in finally block:", unlinkErr);
        }
    }
  }
};

module.exports = PredictHandler;
