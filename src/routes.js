const { getUsersHandler, loginHandler, logoutHandler } = require("./handler");
const {
  getHewanHandler,
  getHewanByIdHandler,
  createHewanHandler,
  updateHewanHandler,
  deleteHewanHandler,
  createImageEndangered,
  getAllImagesEndangered,
  getImageByIdEndangered,
  updateImageEndangered,
  deleteImageEndangered,
} = require("./handler");
const {
  createProvinsiHandler,
  getAllProvinsiHandler,
  getProvinsiByIdHandler,
  updateProvinsiHandler,
  deleteProvinsiHandler,
  createBksdaHandler,
} = require("./handler");
const Joi = require("joi");
const path = require("path");
const { hewanSchema } = require("../schemas/hewanSchema.js");
const routes = [
  {
    method: "POST",
    path: "/login",
    options: { auth: false }, // Nonaktifkan autentikasi untuk login, session untuk aktif
    handler: loginHandler,
  },
  {
    method: "POST",
    path: "/logout",
    handler: logoutHandler,
  },
  {
    method: "GET",
    path: "/",
    options: {
      auth: false,
    },
    handler: (request, h) => {
      return "Hello World!";
    },
  },
  {
    method: "GET",
    path: "/users",
    options: {
      auth: false,
    },
    handler: getUsersHandler,
  },
  // Hewan Dilindungi
  {
    method: "GET",
    path: "/hewandilindungi",
    handler: getHewanHandler,
    options: { auth: false },
  },
  {
    method: "GET",
    path: "/hewandilindungi/{id}",
    handler: getHewanByIdHandler,
    options: { auth: false },
  },
  // {
  //   method: 'POST',
  //   path: '/hewandilindungi',
  //   handler: createHewanHandler,
  //   options: { auth: false },
  // },
  {
    method: "POST",
    path: "/hewandilindungi",
    handler: createHewanHandler,
    options: {
      auth: "session",
      validate: {
        payload: hewanSchema,
        failAction: (request, h, err) => {
          return h.response({ message: err.message }).code(400).takeover();
        },
      },
    },
  },
  // {
  //   method: 'PUT',
  //   path: '/hewandilindungi/{id}',
  //   handler: updateHewanHandler,
  //   options: { auth: 'session' },
  // },
  {
    method: "PUT",
    path: "/hewandilindungi/{id}",
    handler: updateHewanHandler,
    options: {
      auth: "session",
      validate: {
        payload: hewanSchema,
        failAction: (request, h, err) => {
          return h.response({ message: err.message }).code(400).takeover();
        },
      },
    },
  },
  {
    method: "DELETE",
    path: "/hewandilindungi/{id}",
    handler: deleteHewanHandler,
    options: { auth: "session" },
  },
  // Endangered Image
  {
    method: "POST",
    path: "/endangeredimage",
    handler: createImageEndangered,
    options: {
      auth: false,
      payload: {
        output: "stream",
        parse: true,
        allow: "multipart/form-data",
        multipart: true,
        maxBytes: 10 * 1024 * 1024,
      },
      validate: {
        payload: Joi.object({
          idHewan: Joi.number().required(),
          image: Joi.any()
            .meta({ swaggerType: "file" })
            .description("Image file")
            .required(),
        }),
        failAction: (request, h, err) => {
          return h.response({ message: err.message }).code(400).takeover();
        },
      },
    },
  },
  {
    method: "GET",
    path: "/uploads/{filename}",
    handler: {
      directory: {
        path: path.join(__dirname, "../uploads"),
        listing: false,
        index: false,
      },
    },
    options: {
      auth: false,
    },
  },
  {
    method: "GET",
    path: "/endangeredimage",
    handler: getAllImagesEndangered,
    options: { auth: "session" },
  },
  {
    method: "GET",
    path: "/endangeredimage/{id}",
    handler: getImageByIdEndangered,
    options: { auth: "session" },
  },
  {
    method: "PUT",
    path: "/endangeredimage/{id}",
    handler: updateImageEndangered,
    options: {
      auth: "session",
      payload: {
        output: "stream",
        parse: true,
        multipart: true,
        maxBytes: 5 * 1024 * 1024,
        allow: "multipart/form-data",
      },
    },
  },
  {
    method: "DELETE",
    path: "/endangeredimage/{id}",
    handler: deleteImageEndangered,
    options: { auth: "session" },
  },
  // Provinsi ------------------------------------------------------------------
  {
    method: "POST",
    path: "/provinsi",
    handler: createProvinsiHandler,
    options: { auth: "session" },
  },
  {
    method: "GET",
    path: "/provinsi",
    handler: getAllProvinsiHandler,
    options: { auth: "session" },
  },
  {
    method: "GET",
    path: "/provinsi/{id}",
    handler: getProvinsiByIdHandler,
    options: { auth: "session" },
  },
  {
    method: "PUT",
    path: "/provinsi/{id}",
    handler: updateProvinsiHandler,
    options: { auth: "session" },
  },
  {
    method: "DELETE",
    path: "/provinsi/{id}",
    handler: deleteProvinsiHandler,
    options: { auth: "session" },
  },
  //BKSDA
  {
    method: "POST",
    path: "/bksda",
    handler: createBksdaHandler,
    options:{
      auth:"session"
    }
  }
];

module.exports = routes;
