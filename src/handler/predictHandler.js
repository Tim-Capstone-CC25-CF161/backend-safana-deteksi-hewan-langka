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
    const [x, y, w, h, ...classScoresRaw] = pred;

    const classScores = softmax(classScoresRaw);

    const maxClassScore = Math.max(...classScores);
    const classIndex = classScores.indexOf(maxClassScore);

    console.log('Number of classes:', classScores.length);
    console.log('Chosen class index:', classIndex);
    console.log('Class label:', classLabels[classIndex]);

    if (maxClassScore > threshold) {
      const className = classLabels[classIndex];
      if (!className) {
        console.warn(`Warning: classIndex ${classIndex} tidak ada di classLabels`);
      }

      boxes.push({
        class: className || `class-${classIndex}`,
        score: parseFloat(maxClassScore.toFixed(3)),
        bbox: [
          parseFloat((x - w / 2).toFixed(1)),
          parseFloat((y - h / 2).toFixed(1)),
          parseFloat((x + w / 2).toFixed(1)),
          parseFloat((y + h / 2).toFixed(1))
        ]
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

    const tempPath = path.join(os.tmpdir(), uuidv4() + path.extname(file.hapi.filename));
    const fileStream = fs.createWriteStream(tempPath);

    await new Promise((resolve, reject) => {
      file.pipe(fileStream);
      file.on("end", resolve);
      file.on("error", reject);
    });

    const imageBuffer = fs.readFileSync(tempPath);
    const imageTensor = tf.node
      .decodeImage(imageBuffer, 3)
      .resizeBilinear([640, 640])
      .div(255.0)
      .expandDims(0);

    const model = await loadModel();
    const predictions = await model.executeAsync(imageTensor);
    const result = Array.isArray(predictions)
      ? await Promise.all(predictions.map((p) => p.array()))
      : await predictions.array();

    // Dispose tensors supaya tidak memory leak
    if (Array.isArray(predictions)) {
      predictions.forEach(p => p.dispose());
    } else {
      predictions.dispose();
    }
    imageTensor.dispose();

    fs.unlinkSync(tempPath); 

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
