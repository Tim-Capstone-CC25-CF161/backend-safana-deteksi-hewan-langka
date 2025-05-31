// src/route/hewanserupaRoutes.js

const { options } = require('joi');
const {
  createHewanSerupaHandler,
  getAllHewanSerupaHandler,
  getHewanSerupaByIdHandler,
  updateHewanSerupaHandler,
  deleteHewanSerupaHandler,
  getHewanSerupaByIdAsliHandler,
} = require('../handler/similiarHandler'); // Impor semua handler

const hewanserupaRoutes = [
  {
    method: 'POST',
    path: '/hewanserupa',
    handler: createHewanSerupaHandler,
    options: {
    auth: false,
      payload: {
        output: 'stream', 
        parse: true,
        multipart: true 
      }
    }
  },
  {
    method: 'GET',
    path: '/hewanserupa',
    options:{
        auth: false
    },
    handler: getAllHewanSerupaHandler,
  },
  {
    method: 'GET',
    path: '/hewanserupa/{id}', 
    options:
    {
        auth: false
    },
    handler: getHewanSerupaByIdHandler,
  },
  {
    method: 'GET',
    path: '/hewanidserupa/{id}', 
    options:
    {
        auth: false
    },
    handler: getHewanSerupaByIdAsliHandler,
  },
  {
    method: 'PUT', 
    path: '/hewanserupa/{id}',
    handler: updateHewanSerupaHandler,
    options: {
    auth: false,
      payload: {
        output: 'stream',
        parse: true,
        multipart: true
      }
    }
  },
  {
    method: 'DELETE',
    path: '/hewanserupa/{id}',
    options:{
        auth: false
    },
    handler: deleteHewanSerupaHandler,
  },
];

module.exports = hewanserupaRoutes;