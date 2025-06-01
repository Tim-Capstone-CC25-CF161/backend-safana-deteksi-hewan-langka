// src/route/galeriRoutes.js

const { getGaleriHandler } = require('../handler/galeriHandler');

const galeriRoutes = [
    {
        method: 'GET',
        path: '/galeri',
        options: {
            auth: false, 
        },
        handler: getGaleriHandler,
    },
];

module.exports = galeriRoutes;