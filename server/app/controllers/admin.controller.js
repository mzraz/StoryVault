const db = require("../models");
const User = db.users;
const Book = db.books;
const printbooks = db.printbook;
const giftCertificate = db.voucher;
const promoCode = db.promotion_voucher;
const Chapters = db.chapters;
const Questions = db.questions;
const bookchapters = db.bookchapters;
const chapterQuestions = db.chapterquestions;
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const moment = require("moment");
const sequelize = db.sequelize;
const { successResponse, errorResponse } = require("../common/response");

const generateJwt = (payload) => {
  const secretKey = process.env.JWT_SECRET;
  // const expiresIn = process.env.JWT_EXPIRES_IN;
  const token = jwt.sign(payload, secretKey);
  return token;
};

exports.adminSignIn = async (req, res) => {
  const { username, password } = req.body;
  console.log(username);
  console.log(password);
  console.log(process.env.ADMIN_USERNAME);
  console.log(process.env.PASSWORD);
  try {
    if (
      username == process.env.ADMIN_USERNAME &&
      password == process.env.PASSWORD
    ) {
      const adminToken = generateJwt({ username: username });

      const responseObj = {
        role: "admin",
        adminToken,
      };
      return res.status(200).json(responseObj);
    } else {
      return res.status(400).json({ message: " Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: errorResponse(error.message),
    });
  }
};

exports.cardsData = async (req, res) => {
  try {
    const userCount = await User.count();
    const bookCount = await Book.count();
    const printbookCount = await printbooks.count();

    const currentDate = moment().endOf("day");
    const interval = 7;
    const totalWeeks = 5;

    const dataPoints = Array.from({ length: totalWeeks }, (_, index) => {
      const start = moment(currentDate)
        .subtract((totalWeeks - index) * interval, "days")
        .startOf("day");
      const end = moment(start)
        .add(interval - 1, "days")
        .endOf("day");

      return printbooks.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
          [sequelize.fn("COUNT", sequelize.col("print_id")), "totalOrders"],
        ],
        where: {
          createdAt: {
            [Op.between]: [start.toDate(), end.toDate()],
          },
        },
        group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
        raw: true,
      });
    });

    // Resolve all promises to get the counts for each data point
    const totalOrdersData = await Promise.all(dataPoints);

    // Format the response with dates and orders array
    const formattedData = totalOrdersData.map((dataPoint, index) => {
      const start = moment(currentDate)
        .subtract((totalWeeks - index) * interval, "days")
        .startOf("day")
        .toDate();
      const end = moment(start)
        .add(interval - 1, "days")
        .endOf("day")
        .toDate();
      const totalOrders = dataPoint.length > 0 ? dataPoint[0].totalOrders : 0;

      // Format dates to show only the date part
      return {
        start: moment(start).format("YYYY-MM-DD"),
        end: moment(end).format("YYYY-MM-DD"),
        totalOrders,
      };
    });

    // Adjust start date of each interval to match the end date of the previous interval
    for (let i = 1; i < formattedData.length; i++) {
      formattedData[i].start = formattedData[i - 1].end;
    }

    const dataObj = {
      userData: userCount,
      bookData: bookCount,
      printData: printbookCount,
      totalOrdersData: formattedData,
    };

    return res.status(200).json(dataObj);
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//----------------------------------------GIFT CERTIFICATES-----------------------------------
exports.getAllGiftCertificates = async (req, res) => {
  try {
    const vouchers = await giftCertificate.findAll();
    if (!vouchers) {
      return res.status(400).json({ message: "no gift certificate found" });
    }
    return res.status(200).json(vouchers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.deleteGiftCertificate = async (req, res) => {
  try {
    const giftId = req.params.id;
    const giftVoucher = await giftCertificate.findByPk(giftId);
    if (!giftVoucher) {
      return res.status(404).json({
        status: false,
        message: "Gift Certificate not found",
      });
    }
    await giftVoucher.destroy();
    return res.status(200).json({
      status: true,
      message: "Gift Certificate deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//------------------------------------PROMOTION VOUCHER----------------------------
exports.getAllPromoCodes = async (req, res) => {
  try {
    const promo = await promoCode.findAll();
    if (!promo) {
      return res.status(400).json({ message: "no promo code found" });
    }
    return res.status(200).json(promo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.createPromoCodes = async (req, res) => {
  try {
    const { promo_code, promo_value, valid_from, valid_till } = req.body;
    const newPromoCode = await promoCode.create({
      promo_code,
      promo_value,
      valid_from,
      valid_till,
    });

    return res.status(200).json(newPromoCode);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.deletePromoCodes = async (req, res) => {
  try {
    const promoCodeId = req.params.id;
    const promotionCode = await promoCode.findByPk(promoCodeId);
    if (!promotionCode) {
      return res.status(404).json({
        status: false,
        message: "Promo code not found",
      });
    }
    await promotionCode.destroy();
    return res.status(200).json({
      status: true,
      message: "Promo code deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//-------------------------------------users--------------------------------------------
exports.getAllUsers = async (req, res) => {
  try {
    const usersData = await User.findAll();
    if (!usersData) {
      return res.status(400).json({ message: "No user found" });
    }
    return res.status(200).json(usersData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
//-----------------------------------user's books--------------------------------------
exports.previewBook = async (req, res) => {
  const { bookId } = req.body;
  try {
    const data = await Book.findOne({
      where: { bookId },
    });
    const bookName = data.title;
    const userId = data.userId;
    const user = await User.findOne({
      where: {
        userId,
      },
    });
    const awsUserId = user.awsUserId;
    const pdfStoryUrl = `https://s3.us-west-2.amazonaws.com/www.mystoryvault.co/${process.env.BUCKET}/mystorybooks/${bookName}${awsUserId}.pdf`;
    if (!pdfStoryUrl) {
      return res
        .status(400)
        .json({ message: "pdf has not been generated yet" });
    }
    return res
      .status(200)
      .json({ message: "book retreived successfully", pdfStoryUrl });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
//------------------------------------Chapters------------------------------------------

exports.getAllChapters = async (req, res) => {
  try {
    const ChaptersData = await Chapters.findAll({
      where: {
        IsCustom: false,
      },
    });
    if (!ChaptersData) {
      return res.status(400).json({ message: "No chapter found" });
    }
    return res.status(200).json(ChaptersData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.createNonCustomChapter = async (req, res) => {
  try {
    const { name } = req.body;
    const createChapter = await Chapters.create({
      name,
      IsCustom: false,
    });

    return res
      .status(200)
      .json({ message: "Chapter added successfully", createChapter });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

exports.updateNonCustomChapter = async (req, res) => {
  const { chapterId, name } = req.body;
  try {
    await Chapters.update(
      { name },
      {
        where: {
          chapterId,
        },
      }
    );
    return res.status(200).json({ message: "Chapter updated successfully" });
  } catch (error) {
    return res.status(500).jspon({ message: error.message });
  }
};

exports.deleteNonCustomChapter = async (req, res) => {
  const chapterId = req.params.id;
  try {
    await Chapters.destroy({
      where: {
        chapterId,
      },
    });
    return res.status(200).json({ message: "Chapter deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//-----------------------------Questions------------------------------------

exports.getAllQuestionsByChapter = async (req, res) => {
  const chapterId = req.params.id;
  try {
    const QuestionsData = await Questions.findAll({
      where: {
        chapterId,
        IsCustom: false,
      },
    });
    if (!QuestionsData) {
      return res.status(400).json({ message: "No question found" });
    }
    return res.status(200).json(QuestionsData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.createNonCustomQuestion = async (req, res) => {
  try {
    const { name, chapterId } = req.body;
    const createQuestion = await Questions.create({
      chapterId,
      questionDesc: name,
      IsCustom: false,
    });

    return res
      .status(200)
      .json({ message: "Question added successfully", createQuestion });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

exports.updateNonCustomQuestion = async (req, res) => {
  const { questionId, chapterId, name } = req.body;
  console.log("req.body------", req.body);
  try {
    await Questions.update(
      { questionDesc: name, chapterId },
      {
        where: {
          questionId,
        },
      }
    );
    return res.status(200).json({ message: "Question updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteNonCustomQuestion = async (req, res) => {
  const questionId = req.params.id;
  try {
    await Questions.destroy({
      where: {
        questionId,
      },
    });
    return res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//----------------------print book----------------------

exports.getAllPrintedBooks = async (req, res) => {
  try {
    const printedBooksData = await printbooks.findAll({
      include: [
        {
          model: Book,
          as: "book",
          attributes: ["title"],
        },
        {
          model: User,
          as: "user",
          attributes: ["username"],
        },
      ],
    });

    if (!printedBooksData || printedBooksData.length === 0) {
      return res.status(400).json({ message: "No printed book found" });
    }

    return res.status(200).json(printedBooksData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { bookId } = req.body;

    const book = await Book.findOne({
      where: { bookId: bookId },
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    const findBookChapter = await bookchapters.findAll({
      where: {
        bookId: bookId,
      },
    });

    const bookChaptersIds = findBookChapter.map((item) => item.id);

    await chapterQuestions.destroy({
      where: { bookChaptersId: bookChaptersIds },
    });

    await bookchapters.destroy({
      where: { bookId: bookId },
    });

    await book.destroy({
      where: { bookId: bookId },
    });

    return res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
