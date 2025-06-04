// src/route/galeriRoutes.js
const Joi = require('joi');
const { getGaleriHandler, getHistoriesHandler } = require('../handler/galeriHandler');

const galeriRoutes = [
    {
        method: 'GET',
        path: '/galeri',
        options: {
            auth: false, 
        },
        handler: getGaleriHandler,
    },
    {
        method: 'GET',
        path: '/histories/{id}',
        handler: getHistoriesHandler,
        options: {
            auth: false,
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required(), 
                }),
                query: Joi.object({
                    page: Joi.number().integer().min(1).default(1),
                    per_page: Joi.number().integer().min(1).default(5),
                    search_name: Joi.string().allow('').optional(),
                }),
            },
        },
    },
];



module.exports = galeriRoutes;