const {getMapsHandler} = require('../handler/mapsHandler');
const mapsRoutes = [
  {
    method: "GET",
    path: "/maps",
    handler: getMapsHandler,
    options: {
      auth: false,
    },
  },
];

module.exports = mapsRoutes