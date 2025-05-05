
const { getUsersHandler,loginHandler, logoutHandler } = require('./handler');
const routes = [
    {
        method: 'POST',
        path: '/login',
        options: { auth: false },  // Nonaktifkan autentikasi untuk login
        handler: loginHandler,
      },
      {
        method: 'POST',
        path: '/logout',
        handler: logoutHandler,
      },
    {
      method: 'GET',
      path: '/',
      options: {
        auth: false, 
      },
      handler: (request, h) => {
        return 'Hello World!';
      },
    },
    {
        method: 'GET',
        path: '/users',
        options: {
        auth: false, 
      },
        handler: getUsersHandler,
      },
  ];
  
  module.exports = routes;