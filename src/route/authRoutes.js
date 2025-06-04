const Joi = require("joi");

const {
    loginHandler,
  logoutHandler,
  getUsersHandler,
  createAdminHandler,
  updateAdminHandler,
    deleteAdminHandler,
} = require('../handler/authHandler');


const authRoutes = [
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
        method: "POST",
        path: "/register",
        handler: createAdminHandler,
        options: {
          auth: false, 
          validate: {
            payload: Joi.object({
              name: Joi.string().required(),
              username: Joi.string().required(),
              password: Joi.string().required(),
            }),
            failAction: (request, h, err) => {
              return h.response({ message: err.message }).code(400).takeover();
            },
          },
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
      {
        method: "PUT", 
        path: "/users/{id}", 
        handler: updateAdminHandler,
        options: {
            auth: false, 
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required(), 
                }),
                payload: Joi.object({
                    name: Joi.string().optional(), 
                    username: Joi.string().optional(),
                    password: Joi.string().optional(), 
                }).min(1), 
                failAction: (request, h, err) => {
                    return h.response({ message: err.message }).code(400).takeover();
                },
            },
        },
    },
    {
        method: "DELETE", 
        path: "/users/{id}",
        handler: deleteAdminHandler,
        options: {
            
            auth: false,
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required(), // Memastikan 'id' yang diberikan adalah angka integer yang wajib
                }),
                failAction: (request, h, err) => {
                    
                    return h.response({ message: err.message }).code(400).takeover();
                },
            },
        },
    },

]

module.exports = authRoutes;