var DataTypes = require("sequelize").DataTypes;
var _bookchapters = require("../../models/bookchapters");
var _books = require("../../models/books");
var _chapterquestions = require("../../models/chapterquestions");
var _chapters = require("../../models/chapters");
var _coauthors = require("../../models/coauthors");
var _invitation = require("./invitation");
var _questions = require("../../models/questions");
var _users = require("../../models/users");
var _payment = require("./payment");
var _printbook = require("./printbook");
var _promotion_voucher = require("./promotion_voucher");
var _voucher = require("./voucher");
var _promo_redemption = require("./promo_redemption");
var _contactUs = require("./contactUs.js")

function initModels(sequelize) {
  var bookchapters = _bookchapters(sequelize, DataTypes);
  var books = _books(sequelize, DataTypes);
  var chapterquestions = _chapterquestions(sequelize, DataTypes);
  var chapters = _chapters(sequelize, DataTypes);
  var coauthors = _coauthors(sequelize, DataTypes);
  var invitation = _invitation(sequelize, DataTypes);
  var questions = _questions(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);
  var payment = _payment(sequelize, DataTypes);
  var printbook = _printbook(sequelize, DataTypes);
  var promotion_voucher = _promotion_voucher(sequelize, DataTypes);
  var voucher = _voucher(sequelize, DataTypes);
  var promo_redemption = _promo_redemption(sequelize, DataTypes);
  var contactUs = _contactUs(sequelize, DataTypes);

  chapterquestions.belongsTo(bookchapters, { as: "bookChapter", foreignKey: "bookChaptersId" });
  bookchapters.hasMany(chapterquestions, { as: "chapterquestions", foreignKey: "bookChaptersId" });
  bookchapters.belongsTo(books, { as: "book", foreignKey: "bookId" });
  books.hasMany(bookchapters, { as: "bookchapters", foreignKey: "bookId" });
  coauthors.belongsTo(books, { as: "book", foreignKey: "bookId" });
  books.hasMany(coauthors, { as: "coauthors", foreignKey: "bookId" });
  invitation.belongsTo(books, { as: "book", foreignKey: "bookId" });
  books.hasMany(invitation, { as: "invitations", foreignKey: "bookId" });
  bookchapters.belongsTo(chapters, { as: "chapter", foreignKey: "chapterId" });
  chapters.hasMany(bookchapters, { as: "bookchapters", foreignKey: "chapterId" });
  chapterquestions.belongsTo(chapters, { as: "chapter", foreignKey: "chapterId" });
  chapters.hasMany(chapterquestions, { as: "chapterquestions", foreignKey: "chapterId" });
  coauthors.belongsTo(chapters, { as: "chapter", foreignKey: "chapterId" });
  chapters.hasMany(coauthors, { as: "coauthors", foreignKey: "chapterId" });
  invitation.belongsTo(chapters, { as: "chapter", foreignKey: "chapterId" });
  chapters.hasMany(invitation, { as: "invitations", foreignKey: "chapterId" });
  questions.belongsTo(chapters, { as: "chapter", foreignKey: "chapterId" });
  chapters.hasMany(questions, { as: "questions", foreignKey: "chapterId" });
  chapterquestions.belongsTo(questions, { as: "question", foreignKey: "questionId" });
  questions.hasMany(chapterquestions, { as: "chapterquestions", foreignKey: "questionId" });
  coauthors.belongsTo(questions, { as: "question", foreignKey: "questionId" });
  questions.hasMany(coauthors, { as: "coauthors", foreignKey: "questionId" });
  invitation.belongsTo(questions, { as: "question", foreignKey: "questionId" });
  questions.hasMany(invitation, { as: "invitations", foreignKey: "questionId" });
  books.belongsTo(users, { as: "user", foreignKey: "userId" });
  users.hasMany(books, { as: "books", foreignKey: "userId" });
  coauthors.belongsTo(users, { as: "user", foreignKey: "userId" });
  users.hasMany(coauthors, { as: "coauthors", foreignKey: "userId" });
  invitation.belongsTo(users, { as: "senderUser", foreignKey: "senderUserId" });
  users.hasMany(invitation, { as: "invitations", foreignKey: "senderUserId" });
  payment.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(payment, { as: "payments", foreignKey: "user_id" });
   printbook.belongsTo(books, { as: "book", foreignKey: "book_id"});
  books.hasMany(printbook, { as: "printbooks", foreignKey: "book_id"});
  printbook.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(printbook, { as: "printbooks", foreignKey: "user_id"});
  promo_redemption.belongsTo(promotion_voucher, { as: "promo", foreignKey: "promo_id"});
  promotion_voucher.hasMany(promo_redemption, { as: "promo_redemptions", foreignKey: "promo_id"});
  promo_redemption.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(promo_redemption, { as: "promo_redemptions", foreignKey: "user_id"});

  return {
    bookchapters,
    books,
    chapterquestions,
    chapters,
    coauthors,
    invitation,
    questions,
    users,
    payment,
    printbook,
    promotion_voucher,
    voucher,
    promo_redemption,
    contactUs
    
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;