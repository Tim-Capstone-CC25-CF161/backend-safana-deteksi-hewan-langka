// src/route/bksdaRoutes.js

const {
  getAllBksdaHandler,
  getBksdaByIdHandler,
} = require('../handler/bksdaHandler'); 

const bksdaRoutes = [
  {
    method: 'GET',
    path: '/bksda', 
    options: {
      auth: false, 
    },
    handler: getAllBksdaHandler,
  },
  {
    method: 'GET',
    path: '/bksda/{id}', 
    options: {
      auth: false, 
    },
    handler: getBksdaByIdHandler,
  },
];

module.exports = bksdaRoutes;