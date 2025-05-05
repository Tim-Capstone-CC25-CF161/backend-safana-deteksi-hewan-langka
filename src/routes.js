
const { getUsersHandler,loginHandler, logoutHandler } = require('./handler');
const { getArticlesHandler, getArticleByIdHandler, createArticleHandler, updateArticleHandler, deleteArticleHandler } = require('./handler');
const routes = [
    {
        method: 'POST',
        path: '/login',
        options: { auth: false },  // Nonaktifkan autentikasi untuk login, session untuk aktif
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
      {
        method: 'GET',
        path: '/articles',
        handler: getArticlesHandler,
        options: {
          auth: false,
        }
      },
      {
        method: 'GET',
        path: '/articles/{id}',
        handler: getArticleByIdHandler,
        options: {
          auth: false,
        }
      },
      {
        method: 'POST',
        path: '/articles',
        handler: createArticleHandler,
        options: {
          auth: false,
        }
      },
      {
        method: 'PUT',
        path: '/articles/{id}',
        handler: updateArticleHandler,
        options: {
          auth: 'session', // pastikan user login
        }
      },
      {
        method: 'DELETE',
        path: '/articles/{id}',
        handler: deleteArticleHandler,
        options: {
          auth: 'session', // pastikan user login
        }
      }
  ];
  
  module.exports = routes;