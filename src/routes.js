const { getUsersHandler } = require('./handler');
const routes = [
    {
      method: 'GET',
      path: '/',
      handler: (request, h) => {
        return 'Hello World!';
      },
    },
    {
        method: 'GET',
        path: '/users',
        handler: getUsersHandler,
      },
  ];
  
  module.exports = routes;