// src/server.js
require("dotenv").config();
const Hapi = require("@hapi/hapi");
const routes = require("./routes");
const artikelRoutes = require("./route/artikelRoutes");
const cookie = require("@hapi/cookie");
const Inert = require("@hapi/inert");
const predictRoutes = require("./route/predictRoutes");
const similiarRoutes = require('./route/similiarRoutes');

const config = {
  port: process.env.PORT || 9000,
  host: "127.0.0.1",
};

const init = async (c) => {
  try {
    const server = Hapi.server({
      port: c.port,
      host: c.host,
      routes: {
        cors: {
          origin: ["https://tim-capstone-cc25-cf161.github.io",'http://localhost:9000',],
          credentials: true,
        },
      },
    });
    await server.register(Inert);
    // Setup plugin cookie
    await server.register(cookie);

    // Set cookie authentication strategy
    server.auth.strategy("session", "cookie", {
      cookie: {
        password: process.env.SESSION_SECRET,
        name: "sid",
        isHttpOnly: true,
        isSecure: process.env.NODE_ENV === "production",
        isSameSite: 'None',
        ttl: 24 * 60 * 60 * 1000,
      },
      redirectTo: false,
    });

    server.auth.default("session");

    server.route([...routes, ...artikelRoutes, ...predictRoutes, ...similiarRoutes]);

    await server.start();
    console.log(`Server berjalan di ${server.info.uri}`);

    return server;
  } catch (error) {
    console.error("Server gagal dijalankan:", error);
    console.log("SESSION_SECRET:", process.env.SESSION_SECRET);
  }
};

init(config);
