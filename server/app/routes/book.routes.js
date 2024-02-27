const {
  verifySignUp,
  authJwt
} = require("../middleware");
const controller = require("../controllers/books.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/book/create",
    controller.createBook
  );

  app.put(
    "/api/book/update",
    controller.updateBook
  );

  app.get(
    "/api/book/getBookById/:bookId",
    controller.getBookById
  );

  app.get(
    "/api/book/getBookByUserId/:awsUserId",
    controller.getBookByUserId
  );

  app.post(
    "/api/htmltopdf",
    controller.htmlToPdf
  );

  app.post(
    "/api/uploadImage",
    controller.uploadImage
  );

  app.post('/api/coverImage',
    controller.coverImagetoPdf
  );

  app.post('/api/printBook',
    controller.printBook
  );

  app.get('/api/get/orderId/:id',
    controller.getOrderId
  );

  app.post('/print-charges-calculation',
    controller.printChargesCalculation
  );

  app.get('/api/get/free_book/:id',
    controller.freebookStatus
  );

  app.get('/api/get/page_count/:id',
    controller.getPageCount
  );
  app.post('/api/promocalculation',
    controller.calculatePromotionVoucher
  );

  app.post('/api/bookExist',
  controller.bookTitleExist
);

app.post('/api/upload/coverImage',
controller.uploadCoverImageToS3
);

app.post('/api/storyBook/isExist',
controller.isExistStoryBook
);

app.post('/api/upload/luluCover',
controller.coverPdfToLulu
);

app.get('/api/printJobs/getAll/:awsUserId',
controller.getPrintJobsByUserId
);
};