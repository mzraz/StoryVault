const controller = require('../controllers/chapters.controller');

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
    next();
  });

  app.get(
    '/api/chapter/getAll/:bookId',
    controller.getAllChapters
  );

  app.post('/api/addCustomChapter', controller.addCustomChapter);
  app.delete('/api/deleteCustomChapter', controller.deleteCustomChapter);
  app.post('/api/updateCustomChapter', controller.updateCustomChapter);
};
