const db = require("../models");
const Chapter = db.chapters;
const bookChapters = db.bookchapters;
const { errorResponse } = require("../common/response");

exports.addCustomChapter = async (req, res) => {
  try {
    const bookId = req.body.bookId;
    const lastChapter = await bookChapters.findOne({
      where: { bookId },
      order: [["chaptersequenceNumber", "DESC"]],
      limit: 1,
      raw: true,
    });

    const newChapterSequenceNumber = lastChapter
      ? lastChapter.chaptersequenceNumber + 1
      : 1;

    const chapter = {
      name: req.body.name,
      IsCustom: true,
    };

    const createdChapter = await Chapter.create(chapter);
    await bookChapters.create({
      bookId: bookId,
      chapterId: createdChapter.chapterId,
      chaptersequenceNumber: newChapterSequenceNumber,
    });

    res.json({
      chapterId: createdChapter.chapterId,
      name: createdChapter.name,
      sequenceNumber: newChapterSequenceNumber,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: errorResponse(err.message),
    });
  }
};
exports.deleteCustomChapter = async (req, res) => {
  try {
    const chapterId = req.body.chapterId;
    const chapter = await Chapter.findOne({
      where: { chapterId: chapterId, IsCustom: true },
    });
    if (!chapter) {
      return res.status(404).json({
        status: false,
        message: "Custom chapter not found",
      });
    }
    const bookChapter = await bookChapters.findOne({
      where: { chapterId: chapterId },
    });
    if (bookChapter) {
      await bookChapter.destroy();
    }
    if (chapter) {
      await chapter.destroy();
    }

    res.status(200).json({
      status: true,
      message: "Custom chapter deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: errorResponse(err.message),
    });
  }
};

exports.getAllChapters = async (req, res) => {
  try {
    let chapters = [];

    const customChapters = await Chapter.findAll({
      where: {
        IsCustom: true,
      },
      include: [
        {
          model: bookChapters,
          as: "bookchapters",
          attributes: ["bookId"],
          where: {
            bookId: req.params.bookId,
          },
        },
      ],
    });

    const nonCustomChapters = await Chapter.findAll({
      where: {
        IsCustom: false,
      },
    });

    chapters = chapters.concat(nonCustomChapters, customChapters);

    res.status(200).json({
      status: true,
      message: "operation performed successfully",
      data: chapters,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.updateCustomChapter = async (req, res) => {
  try {
    const { chapterId, name } = req.body;
    const chapter = await Chapter.findOne({
      where: { chapterId, IsCustom: true },
    });
    if (!chapter) {
      return res.status(404).json({
        status: false,
        message: "Custom chapter not found",
      });
    }
    chapter.name = name;
    await chapter.save();
    res.json({
      chapterId: chapter.chapterId,
      name: chapter.name,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: errorResponse(err.message),
    });
  }
};
