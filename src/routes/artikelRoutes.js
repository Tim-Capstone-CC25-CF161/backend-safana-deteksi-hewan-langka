const {
  getArticlesHandler,
  getArticleByIdHandler,
  createArticleHandler,
  updateArticleHandler,
  deleteArticleHandler,
} = require("../handler/artikelHandler");

const artikelRoutes = [{
    method: "GET",
    path: "/articles",
    handler: getArticlesHandler,
    options: {
      auth: false,
    },
  },
  {
    method: "GET",
    path: "/articles/{id}",
    handler: getArticleByIdHandler,
    options: {
      auth: false,
    },
  },
  {
    method: "POST",
    path: "/articles",
    handler: createArticleHandler,
    options: {
      auth: false,
    },
  },
  {
    method: "PUT",
    path: "/articles/{id}",
    handler: updateArticleHandler,
    options: {
      auth: "session", // pastikan user login
    },
  },
  {
    method: "DELETE",
    path: "/articles/{id}",
    handler: deleteArticleHandler,
    options: {
      auth: "session", // pastikan user login
    },
  },
];
module.exports =  artikelRoutes;