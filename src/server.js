const Hapi = require('@hapi/hapi');
const routes = require('./routes');

const config = {
  port: 9000,
  host: 'localhost',
};

const init = async (c) => {
  try {
    const server = Hapi.server({
      port: c.port,
      host: c.host,
      routes: {
        cors: {
          origin: ['*'],
        },
      },
    });

    server.route(routes);

    await server.start();
    console.log(`Server berjalan di ${server.info.uri}`);
    return server;
  } catch (error) {
    console.error('Server gagal dijalankan:', error);
  }
};

init(config);
