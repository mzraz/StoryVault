const db = require("../models");
const questions = db.questions;
const chapters = db.chapters;
const bookChapters = db.bookchapters;
const chapterQuestions = db.chapterquestions;
const sequelize = db.sequelize;
const invitation = db.invitation;
const User = db.users;
const coauthor = db.coauthors;

const getQuestionsByChapterId = async (req, res) => {
  let question = [];
  const { bookId, chapterIds } = req.body;
  try {
    let founds = [];
    let customRes = {};
    for (let b = 0; b < chapterIds.length; b++) {
      const customChapter = await sequelize.query(
        `
      SELECT bc.* FROM bookchapters bc 
      LEFT JOIN chapterquestions cq ON(bc.id=cq.bookChaptersId) 
      WHERE  bc.bookId=` +
          bookId +
          ` AND cq.chapterId=` +
          chapterIds[b] +
          `
      `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      if (customChapter.length == 0) {
        founds.push(chapterIds[b]);
      }
    }
    if (founds.length > 0) {
      const chapterNames = await chapters.findAll({
        where: {
          chapterId: founds,
          IsCustom: true,
        },
        attributes: ["chapterId", "name", "IsCustom"],
      });

      chapterNames.map(({ chapterId, name }) =>
        question.push({
          chapterId,
          chapterName: name,
          IsCustom: "",
          questionDesc: "",
          questionId: 0,
        })
      );
    }
    console.log(founds);
    const customResults = await sequelize.query(
      `
    SELECT q.questionId, q.questionDesc, c.chapterId, c.name as chapterName, q.IsCustom
    FROM books b
    JOIN bookchapters bc ON bc.bookId = b.bookId
    JOIN chapters c ON c.chapterId = bc.chapterId
    JOIN chapterquestions cq ON cq.chapterId = c.chapterId
    JOIN questions q ON q.questionId = cq.questionId
    WHERE b.bookId = :bookId AND c.chapterId IN (:chapterIds) AND cq.bookChaptersId = bc.id AND q.IsCustom = true
    ORDER BY cq.questionSequenceNumber;
    `,
      {
        replacements: { bookId, chapterIds },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    const nonCustomquestions = await questions.findAll({
      where: {
        chapterId: chapterIds,
        IsCustom: false,
      },
      include: [
        {
          model: chapters,
          as: "chapter",
          attributes: ["name"],
        },
      ],
    });
    let noncustomRes = {};
    for (const nonCustomquestion of nonCustomquestions) {
      noncustomRes = {
        chapterId: nonCustomquestion.chapterId,
        chapterName: nonCustomquestion.chapter.name,
        IsCustom: nonCustomquestion.IsCustom,
        questionDesc: nonCustomquestion.questionDesc,
        questionId: nonCustomquestion.questionId,
      };

      question.push(noncustomRes);
    }

    if (customResults.length > 0) {
      for (const customResult of customResults) {
        customRes = {
          chapterId: customResult.chapterId,
          chapterName: customResult.chapterName,
          IsCustom: customResult.IsCustom[0] == 1 ? true : false,
          questionDesc: customResult.questionDesc,
          questionId: customResult.questionId,
        };
        question.push(customRes);
      }
    }

    const missingChapterIds = chapterIds.filter(
      (id) => !question.some((q) => q.chapterId === id)
    );
    const missingChapters = await chapters.findAll({
      where: {
        chapterId: missingChapterIds,
      },
      attributes: ["chapterId", "name"],
    });
    missingChapters.forEach(({ chapterId, name }) => {
      question.push({
        chapterId,
        chapterName: name,
        IsCustom: "",
        questionDesc: "",
        questionId: 0,
      });
    });

    res.json(question);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

const addCustomQuestion = async (req, res) => {
  try {
    let bookChapter = await bookChapters.findOne({
      where: {
        bookId: req.body.bookId,
        chapterId: req.body.chapterId,
      },
    });
    if (!bookChapter) {
      const lastChapter = await bookChapters.findOne({
        where: {
          bookId: req.body.bookId,
        },
        order: [["chapterSequenceNumber", "DESC"]],
      });
      const newChapterSeq = lastChapter
        ? lastChapter.chaptersequenceNumber + 1
        : 1;

      bookChapter = await bookChapters.create({
        bookId: req.body.bookId,
        chapterId: req.body.chapterId,
        chaptersequenceNumber: newChapterSeq,
      });
    }
    const lastQuestion = await chapterQuestions.findOne({
      where: {
        bookChaptersId: bookChapter.id,
        chapterId: req.body.chapterId,
      },
      order: [["questionSequenceNumber", "DESC"]],
    });

    const newQuestion = await questions.create({
      questionDesc: req.body.questionDesc,
      chapterId: req.body.chapterId,
      IsCustom: true,
    });

    const newChapterQuestion = await chapterQuestions.create({
      bookChaptersId: bookChapter.id,
      chapterId: req.body.chapterId,
      questionId: newQuestion.questionId,
      questionSequenceNumber: lastQuestion
        ? lastQuestion.questionSequenceNumber + 1
        : 1,
      answer: "",
    });

    res.status(200).json({
      status: true,
      data: newChapterQuestion,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

const deleteCustomQuestion = async (req, res) => {
  try {
    const questionId = req.body.questionId;

    const question = await questions.findOne({
      where: { questionId: questionId, IsCustom: true },
    });

    if (!question) {
      return res.status(404).json({
        status: false,
        message: "Custom question not found, Invalid id",
      });
    }
    const chapterQuestion = await chapterQuestions.findOne({
      where: { questionId: questionId },
    });
    if (chapterQuestion) {
      await chapterQuestion.destroy();
    }
    if (question) {
      await question.destroy();
    }
    res.status(200).json({
      status: true,
      message: "Custom question deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

const updateCustomQuestion = async (req, res) => {
  try {
    const { questionId, questionDesc } = req.body;

    const question = await questions.findOne({
      where: { questionId, IsCustom: true },
    });

    if (!question) {
      return res.status(404).json({
        status: false,
        message: "Question not found",
      });
    }

    question.questionDesc = questionDesc;
    await question.save();

    res.status(200).json({
      status: true,
      message: "Question updated successfully",
      data: question,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

const getQuestionByEmail = async (req, res) => {
  const { email, bookId } = req.body;

  try {
    const questionData = await sequelize.query(`
    SELECT q.questionId, q.questionDesc, c.name, c.chapterId, i.status, cq.answer, b.title
    FROM invitation i 
    JOIN books b ON i.bookId = b.bookId AND i.senderUserId = b.userId 
    JOIN bookchapters bc ON i.bookId = bc.bookId AND i.chapterId = bc.chapterId 
    JOIN chapterquestions cq ON bc.id = cq.bookChaptersId AND i.questionId = cq.questionId 
    JOIN questions q ON cq.questionId = q.questionId 
    JOIN chapters c ON bc.chapterId = c.chapterId
    WHERE i.recieverEmail = '${email}' AND i.bookId = '${bookId}' 
    `);

    if (questionData.length === 0) {
      return res.status(404).send("Question not found");
    }
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).send("User not found");
    }
    const coAuthor = await invitation.findOne({
      where: { recieverEmail: email },
    });

    const chapters = [];
    questionData[0].forEach((q) => {
      const chapter = chapters.find((c) => c.chapterName === q.name);
      if (chapter) {
        chapter.questions.push({
          questionId: q.questionId,
          questionDesc: q.questionDesc,
          status: q.status,
          answer: q.answer,
        });
      } else {
        chapters.push({
          chapterId: q.chapterId,
          chapterName: q.name,
          questions: [
            {
              questionId: q.questionId,
              questionDesc: q.questionDesc,
              status: q.status,
              answer: q.answer,
            },
          ],
        });
      }
    });
    for (const q of questionData[0]) {
      const existingCoAuthor = await coauthor.findOne({
        where: {
          userId: user.userId,
          bookId: coAuthor.bookId,
          chapterId: q.chapterId,
          questionId: q.questionId,
        },
      });

      if (!existingCoAuthor) {
        const coauthorData = {
          userId: user.userId,
          bookId: coAuthor.bookId,
          chapterId: q.chapterId,
          questionId: q.questionId,
          isAnswered: 0,
        };
        await coauthor.create(coauthorData);
      }
    }
    const responseObj = {
      userName: user.username,
      bookName: questionData[0][0].title,
      chapters,
    };

    res.json(responseObj);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

module.exports = {
  getQuestionByEmail,
  getQuestionsByChapterId,
  deleteCustomQuestion,
  addCustomQuestion,
  updateCustomQuestion,
};
