const config = require('../config/db.config.js');

var DataTypes = require('sequelize').DataTypes;
const Sequelize = require('sequelize');
const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: config.dialect,
  operatorsAliases: 0,

  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require('../models/users')(sequelize, Sequelize);
db.books = require('../models/books')(sequelize, Sequelize);
db.bookchapters = require('../models/bookchapters')(sequelize, Sequelize);
db.questions = require('../models/questions')(sequelize, Sequelize);
db.chapters = require('../models/chapters')(sequelize, Sequelize);
db.chapterquestions = require('../models/chapterquestions')(sequelize, Sequelize);
db.coauthors = require('../models/coauthors')(sequelize, Sequelize);
db.invitation = require('../models/invitation')(sequelize, Sequelize);
db.payment = require('../models/payment')(sequelize, DataTypes);
db.printbook = require('../models/printbook')(sequelize, DataTypes);
db.voucher = require('../models/voucher')(sequelize, DataTypes);
db.promotion_voucher = require('../models/promotion_voucher.js')(sequelize, DataTypes);
db.promo_redemption = require("../models/promo_redemption")(sequelize, DataTypes);
db.contactUs = require("./contactUs.js")(sequelize, DataTypes);

db.chapterquestions.belongsTo(db.bookchapters, { as: "bookChapter", foreignKey: "bookChaptersId" });
db.bookchapters.hasMany(db.chapterquestions, { as: "chapterquestions", foreignKey: "bookChaptersId" });
db.bookchapters.belongsTo(db.books, { as: "book", foreignKey: "bookId" });
db.books.hasMany(db.bookchapters, { as: "bookchapters", foreignKey: "bookId" });
db.coauthors.belongsTo(db.books, { as: "book", foreignKey: "bookId" });
db.books.hasMany(db.coauthors, { as: "coauthors", foreignKey: "bookId" });
db.invitation.belongsTo(db.books, { as: "book", foreignKey: "bookId" });
db.books.hasMany(db.invitation, { as: "invitations", foreignKey: "bookId" });
db.bookchapters.belongsTo(db.chapters, { as: "chapter", foreignKey: "chapterId" });
db.chapters.hasMany(db.bookchapters, { as: "bookchapters", foreignKey: "chapterId" });
db.chapterquestions.belongsTo(db.chapters, { as: "chapter", foreignKey: "chapterId" });
db.chapters.hasMany(db.chapterquestions, { as: "chapterquestions", foreignKey: "chapterId" });
db.coauthors.belongsTo(db.chapters, { as: "chapter", foreignKey: "chapterId" });
db.chapters.hasMany(db.coauthors, { as: "coauthors", foreignKey: "chapterId" });
db.invitation.belongsTo(db.chapters, { as: "chapter", foreignKey: "chapterId" });
db.chapters.hasMany(db.invitation, { as: "invitations", foreignKey: "chapterId" });
db.questions.belongsTo(db.chapters, { as: "chapter", foreignKey: "chapterId" });
db.chapters.hasMany(db.questions, { as: "questions", foreignKey: "chapterId" });
db.chapterquestions.belongsTo(db.questions, { as: "question", foreignKey: "questionId" });
db.questions.hasMany(db.chapterquestions, { as: "chapterquestions", foreignKey: "questionId" });
db.coauthors.belongsTo(db.questions, { as: "question", foreignKey: "questionId" });
db.questions.hasMany(db.coauthors, { as: "coauthors", foreignKey: "questionId" });
db.invitation.belongsTo(db.questions, { as: "question", foreignKey: "questionId" });
db.questions.hasMany(db.invitation, { as: "invitations", foreignKey: "questionId" });
db.books.belongsTo(db.users, { as: "user", foreignKey: "userId" });
db.users.hasMany(db.books, { as: "books", foreignKey: "userId" });
db.coauthors.belongsTo(db.users, { as: "user", foreignKey: "userId" });
db.users.hasMany(db.coauthors, { as: "coauthors", foreignKey: "userId" });
db.invitation.belongsTo(db.users, { as: "senderUser", foreignKey: "senderUserId" });
db.users.hasMany(db.invitation, { as: "invitations", foreignKey: "senderUserId" });
db.payment.belongsTo(db.users, { as: "user", foreignKey: "user_id" });
db.users.hasMany(db.payment, { as: "payments", foreignKey: "user_id" });
db.printbook.belongsTo(db.books, { as: "book", foreignKey: "book_id"});
db.books.hasMany(db.printbook, { as: "printbooks", foreignKey: "book_id"});
db.printbook.belongsTo(db.users, { as: "user", foreignKey: "user_id"});
db.users.hasMany(db.printbook, { as: "printbooks", foreignKey: "user_id"});
db.promo_redemption.belongsTo(db.promotion_voucher, { as: "promo", foreignKey: "promo_id"});
db.promotion_voucher.hasMany(db.promo_redemption, { as: "promo_redemptions", foreignKey: "promo_id"});
db.promo_redemption.belongsTo(db.users, { as: "user", foreignKey: "user_id"});
db.users.hasMany(db.promo_redemption, { as: "promo_redemptions", foreignKey: "user_id"});
module.exports = db;