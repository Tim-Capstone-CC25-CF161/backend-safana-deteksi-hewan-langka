// const tf = require('@tensorflow/tfjs-node');
// const fs = require('fs');
// const path = require('path');
// const os = require('os');
// const { v4: uuidv4 } = require('uuid');

// let modelPromise;

// async function loadModel() {
//   if (!modelPromise) {
//     modelPromise = tf.loadGraphModel('file://model/model.json');
//   }
//   return modelPromise;
// }

// const PredictHandler = async (request, h) => {
//   try {
//     const data = request.payload;
//     const { file } = data;

//     const tempPath = path.join(os.tmpdir(), uuidv4() + path.extname(file.hapi.filename));
//     const fileStream = fs.createWriteStream(tempPath);

//     await new Promise((resolve, reject) => {
//       file.pipe(fileStream);
//       file.on('end', resolve);
//       file.on('error', reject);
//     });

//     // Load dan proses gambar
//     const imageBuffer = fs.readFileSync(tempPath);
//     const imageTensor = tf.node.decodeImage(imageBuffer)
//       .resizeBilinear([416, 416])
//       .div(255.0)
//       .expandDims(0);

//     const model = await loadModel();
//     const predictions = await model.executeAsync(imageTensor);

//     // [Sederhana] Kembalikan output tensor mentah
//     const result = Array.isArray(predictions)
//       ? await Promise.all(predictions.map(p => p.array()))
//       : await predictions.array();

//     fs.unlinkSync(tempPath); // Bersihkan file

//     return h.response({
//       message: 'Prediction successful',
//       result
//     }).code(200);

//   } catch (err) {
//     console.error('Prediction error:', err);
//     return h.response({ error: 'Internal Server Error' }).code(500);
//   }
// };

// module.exports = PredictHandler;
