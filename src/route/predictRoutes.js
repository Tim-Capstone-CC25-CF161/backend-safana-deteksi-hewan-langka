const { options } = require('joi');
const PredictHandler = require('../handler/predictHandler');

module.exports = [
  {
    method: 'POST',
    path: '/predict',
    options: {
      auth: false,
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        maxBytes: 1024 * 1024 * 10, // 10MB
      }
    },
    handler: PredictHandler
  },
  {
  method: 'GET',
  path: '/testhandler',
  options: {
    auth: false,
  },
  handler: (request, h) => {
    return '<h1>Hello World!</h1>';
  }
}
];
