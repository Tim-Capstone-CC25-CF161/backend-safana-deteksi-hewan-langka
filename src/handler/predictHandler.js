const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

let modelPromise;

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

async function loadModel() {
  if (!modelPromise) {
    modelPromise = tf.loadGraphModel("file://model/model.json");
  }
  return modelPromise;
}

function softmax(arr) {
  const max = Math.max(...arr);
  const exps = arr.map(x => Math.exp(x - max));
  const sum = exps.reduce((a,b) => a + b, 0);
  return exps.map(e => e / sum);
}

function processPredictions(rawPredictions, threshold = 0.25) {
  const predictions = rawPredictions[0];
  const boxes = [];

  for (const pred of predictions) {
    // Contoh pred: [x, y, w, h, score0, score1, ..., scoreN]
    const [x, y, w, h, ...scoresRaw] = pred;

    // Jalankan softmax untuk dapat probabilitas kelas yang benar
    const classScores = softmax(scoresRaw);

    const maxClassScore = Math.max(...classScores);
    const classIndex = classScores.indexOf(maxClassScore);

    if (maxClassScore > threshold) {
      const className = classLabels[classIndex] || `class-${classIndex}`;
      const xmin = parseFloat((x - w / 2).toFixed(1));
      const ymin = parseFloat((y - h / 2).toFixed(1));
      const xmax = parseFloat((x + w / 2).toFixed(1));
      const ymax = parseFloat((y + h / 2).toFixed(1));

      boxes.push({
        class: className,
        score: parseFloat(maxClassScore.toFixed(3)),
        bbox: [xmin, ymin, xmax, ymax]
      });
    }
  }
  return boxes;
}

const PredictHandler = async (request, h) => {
  try {
    const data = request.payload;
    const { file } = data;

    if (!file || !file.hapi || !file._data) {
      return h.response({ error: "File tidak ditemukan di request" }).code(400);
    }

    // Simpan file sementara
    const tempPath = path.join(os.tmpdir(), uuidv4() + path.extname(file.hapi.filename));
    const fileStream = fs.createWriteStream(tempPath);

    await new Promise((resolve, reject) => {
      file.pipe(fileStream);
      file.on("end", resolve);
      file.on("error", reject);
    });

    // Load dan preprocess gambar
    const imageBuffer = fs.readFileSync(tempPath);
    const imageTensor = tf.node
      .decodeImage(imageBuffer, 3)
      .resizeBilinear([640, 640])
      .div(255.0)
      .expandDims(0);

    // Load model dan prediksi
    const model = await loadModel();
    const predictions = await model.executeAsync(imageTensor);

    // Konversi prediksi ke array
    const result = Array.isArray(predictions)
      ? await Promise.all(predictions.map(p => p.array()))
      : await predictions.array();

    // Dispose tensor agar tidak memory leak
    if (Array.isArray(predictions)) {
      predictions.forEach(p => p.dispose());
    } else {
      predictions.dispose();
    }
    imageTensor.dispose();

    // Hapus file sementara
    fs.unlinkSync(tempPath);

    // Proses hasil prediksi dan kembalikan ke client
    const processed = processPredictions(result);

    return h.response({
      message: "Prediction successful",
      result: processed
    }).code(200);

  } catch (err) {
    console.error("Prediction error:", err);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

module.exports = PredictHandler;
