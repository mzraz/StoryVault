const db = require("../models");
const chapterQuestions = db.chapterquestions;
const books = db.books;
const bookChapters = db.bookchapters;
const sequelize = db.sequelize;
const coauthor = db.coauthors;
const invitation = db.invitation;

exports.createAnswer = async (req, res) => {
  try {
    const { bookId, chapters } = req.body;
    const chapterIds = chapters.map((chapter) => chapter.chapterId);
    const existingAnswers = await chapterQuestions.findAll({
      where: {
        chapterId: chapterIds,
        questionId: chapters.reduce(
          (acc, chapter) => [
            ...acc,
            ...chapter.questions.map((q) => q.questionId),
          ],
          []
        ),
      },
    });

    const existingAnswersMap = {};
    existingAnswers.forEach((answer) => {
      const key = `${answer.chapterId}-${answer.questionId}-${answer.bookChaptersId}`;
      existingAnswersMap[key] = answer;
    });

    const newAnswersToCreate = [];
    const answersToUpdate = [];
    for (const chapter of chapters) {
      const { chapterId, questions } = chapter;
      const bookChapter = await bookChapters.findOne({
        where: {
          bookId: bookId,
          chapterId: chapterId,
        },
      });

      if (!bookChapter) {
        res.status(400).json({ message: "Book chapter not found" });
        return;
      }

      const bookChaptersId = bookChapter.id;

      for (const question of questions) {
        const { questionId, answer, questionSequenceNumber } = question;
        const key = `${chapterId}-${questionId}-${bookChaptersId}`;

        if (existingAnswersMap[key]) {
          const existingAnswer = existingAnswersMap[key];
          existingAnswer.answer = answer;
          existingAnswer.questionSequenceNumber = questionSequenceNumber;
          answersToUpdate.push(existingAnswer);
        } else {
          newAnswersToCreate.push({
            chapterId,
            questionId,
            answer,
            questionSequenceNumber,
            bookChaptersId,
          });
        }
      }
    }
    const transaction = await sequelize.transaction();

    try {
      if (newAnswersToCreate.length > 0) {
        await chapterQuestions.bulkCreate(newAnswersToCreate, { transaction });
      }
      for (const answer of answersToUpdate) {
        await answer.save({ transaction });
      }
      await transaction.commit();

      res.json({ message: "Answers saved successfully" });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.saveWizard = async (req, res) => {
  const { bookId, chapters } = req.body;
  try {
    const existingBook = await bookChapters.findAll({ where: { bookId } });
    if (existingBook.length === 0) {
      // New book
      const createdRecords = [];
      let sequenceNumber = 1;
      for (const chapter of chapters) {
        const { chapterId, questions } = chapter;
        const existingChapter = await bookChapters.findOne({
          where: { bookId, chapterId },
        });
        if (existingChapter) {
          continue;
        }
        try {
          const newChapter = await bookChapters.create({
            bookId: bookId,
            chapterId,
            chaptersequenceNumber: sequenceNumber,
          });
          let questionSequenceNumber = 1;
          for (const question of questions) {
            const { questionId } = question;
            const existingQuestion = await chapterQuestions.findOne({
              where: { chapterId, questionId },
            });
            const newQuestion = await chapterQuestions.create({
              chapterId,
              questionId,
              questionSequenceNumber,
              answer: "",
              bookChaptersId: newChapter.id,
            });
            createdRecords.push(newQuestion);
            questionSequenceNumber++;
          }
          createdRecords.push(newChapter);
          sequenceNumber++;
        } catch (error) {
          throw error;
        }
      }
      res.json({ createdRecords });
    } else {
      // Existing book
      const createdRecords = [];
      const deletedRecords = [];
      let sequenceNumber = 1;
      for (const chapter of existingBook) {
        const { chapterId } = chapter;
        const chapterIndex = chapters.findIndex(
          (c) => c.chapterId === chapterId
        );
        if (chapterIndex === -1) {
          // Chapter does not exist in request body, delete it and its questions
          await chapterQuestions.destroy({
            where: { chapterId, bookChaptersId: chapter.id },
          });
          await bookChapters.destroy({ where: { bookId, chapterId } });
          deletedRecords.push(chapter);
        } else {
          const questions = chapters[chapterIndex].questions;
          await chapter.update({ chaptersequenceNumber: sequenceNumber });
          let questionSequenceNumber = 1;
          const chapterQuestionsData = await chapter.getChapterquestions();
          for (const question of chapterQuestionsData) {
            const { questionId } = question;
            const questionIndex = questions.findIndex(
              (q) => q.questionId === questionId
            );
            if (questionIndex === -1) {
              // Question does not exist in request body, delete it
              await question.destroy({
                where: { chapterId, bookChaptersId: chapter.id },
              });
              deletedRecords.push(question);
            } else {
              await question.update({
                questionSequenceNumber,
              });
              questionSequenceNumber++;
            }
          }
          for (let i = 0; i < questions.length; i++) {
            const { questionId } = questions[i];
            const existingQuestion = await chapterQuestions.findOne({
              where: { chapterId, questionId, bookChaptersId: chapter.id },
            });
            if (!existingQuestion) {
              const newQuestion = await chapterQuestions.create({
                chapterId,
                questionId,
                questionSequenceNumber: questionSequenceNumber++,
                answer: "",
                bookChaptersId: chapter.id,
              });
              createdRecords.push(newQuestion);
            } else {
              await existingQuestion.update({
                questionSequenceNumber: questionSequenceNumber++,
              });
            }
          }
          sequenceNumber++;
        }
      }
      for (let i = 0; i < chapters.length; i++) {
        const { chapterId } = chapters[i];
        const existingChapter = await bookChapters.findOne({
          where: { bookId, chapterId },
        });
        if (!existingChapter) {
          const newChapter = await bookChapters.create({
            bookId,
            chapterId,
            chaptersequenceNumber: sequenceNumber++,
          });
          createdRecords.push(newChapter);
          const chapterQuestionsData = chapters[i].questions.map((q) => ({
            chapterId,
            questionId: q.questionId,
            questionSequenceNumber: q.questionSequenceNumber,
            answer: q.answer,
            bookChaptersId: newChapter.id,
          }));
          const newChapterQuestions = await chapterQuestions.bulkCreate(
            chapterQuestionsData
          );
          createdRecords.push(...newChapterQuestions);
        }
      }

      res.json({ createdRecords, deletedRecords });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getBookDataById = async (req, res) => {
  try {
    const { bookId } = req.params;
    const bookData = [];
    const {
      title,
      bookType,
      cover_template_id,
      book_color,
      frontCover,
      template_id,
      title_color,
      author_color,
      subtitle_color,
      dedication_color,
      spine_color,
      font,
      title_fontSize,
      subtitle_fontSize,
      author_fontSize,
      bookTitle_top,
      subtitle_top,
      bookTitle_left,
      subtitle_left,
      author,
      header_text,
    } = await books.findOne({
      where: { bookId: req.params.bookId },
    });
    const invitationData = await sequelize.query(`
    SELECT i.questionId, i.recieverEmail, i.bookId, i.chapterId, i.status
    FROM invitation i
    WHERE i.bookId = '${bookId}'
    `);

    await sequelize
      .query(
        `SELECT c.* ,ch.name, ch.IsCustom as chapterIsCustom
      FROM bookchapters c 
      LEFT JOIN chapters ch 
      ON(c.chapterId=ch.chapterId) 
      WHERE c.bookId='${bookId}'
      ORDER BY c.chaptersequenceNumber`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      )
      .then(async function (bookdata) {
        if (bookdata.length > 0) {
          for (let i = 0; i < bookdata.length; i++) {
            let chapter = {
              // Create a new object 'chapter' with required properties
              id: bookdata[i].chapterId,
              name: bookdata[i].name,
              chapterSequence: bookdata[i].chaptersequenceNumber,
              IsCustom: bookdata[i].chapterIsCustom,
              questions: [], // Initialize questions as an empty array
            };
            await sequelize
              .query(
                `SELECT qq.*, q.questionDesc, q.IsCustom as questionIsCustom FROM chapterquestions qq  
            LEFT JOIN questions q ON(q.questionId=qq.questionId) 
            WHERE qq.bookChaptersId='${bookdata[i].id}' and qq.chapterId='${bookdata[i].chapterId}'
            ORDER BY qq.questionSequenceNumber`,
                {
                  type: sequelize.QueryTypes.SELECT,
                }
              )
              .then(async function (alldata) {
                if (alldata.length > 0) {
                  for (let j = 0; j < alldata.length; j++) {
                    let question = {
                      // Create a new object 'question' with required properties
                      id: alldata[j].questionId,
                      question: alldata[j].questionDesc,
                      questionSequence: alldata[j].questionSequenceNumber,
                      IsCustom: alldata[j].questionIsCustom,
                      answer: alldata[j].answer,
                    };
                    const invitationRecord = invitationData[1].find(
                      (record) =>
                        record.bookId === bookdata[i].bookId &&
                        record.questionId === alldata[j].questionId &&
                        record.chapterId === bookdata[i].chapterId
                    );
                    if (invitationRecord) {
                      question.recieverEmail = invitationRecord.recieverEmail;
                    }
                    chapter.questions.push(question);
                  }
                }
              });
            bookData.push(chapter);
          }
        }
        console.log(bookData);
      });
    res.status(200).json({
      message: "Book Data retrieved successfully",
      bookId: bookId,
      bookType,
      title,
      bookData,
      cover_template_id,
      book_color,
      frontCover,
      template_id,
      title_color,
      author_color,
      subtitle_color,
      dedication_color,
      spine_color,
      font,
      title_fontSize,
      subtitle_fontSize,
      author_fontSize,
      bookTitle_top,
      subtitle_top,
      bookTitle_left,
      subtitle_left,
      author,
      header_text,
    });
  } catch (error) {
    res.status(500).json({
      type: "BookData",
      message: "Failed to retrieve Book Data",
      error: error.message,
    });
  }
};

exports.updateSequenceNumbers = async (req, res) => {
  try {
    const { bookId, chapters } = req.body;

    for (const chapter of chapters) {
      await bookChapters.update(
        { chaptersequenceNumber: chapter.chapterSequenceNumber },
        { where: { bookId: bookId, chapterId: chapter.chapterId } }
      );
      for (const question of chapter.questions) {
        await chapterQuestions.update(
          { questionSequenceNumber: question.questionSequenceNumber },
          {
            where: {
              chapterId: chapter.chapterId,
              questionId: question.questionId,
            },
          }
        );
      }
    }

    res.status(200).json({ message: "Sequence numbers updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.coAuthorAnswer = async (req, res) => {
  try {
    const { chapterId, questionId, answer, bookId } = req.body;

    const bookChapter = await bookChapters.findOne({
      where: {
        bookId,
        chapterId,
      },
    });

    if (!bookChapter) {
      return res.status(400).json({ message: "Book chapter not found" });
    }

    const bookChaptersId = bookChapter.id;

    let existingAnswer = await chapterQuestions.findOne({
      where: {
        chapterId,
        questionId,
        bookChaptersId,
      },
    });

    if (!existingAnswer) {
      return res.status(400).json({ message: "Answer not found" });
    }

    existingAnswer.answer = answer;
    await existingAnswer.save();

    let coAuthor = await coauthor.findOne({
      where: {
        questionId,
        bookId,
        chapterId,
      },
    });

    if (!coAuthor) {
      return res.status(400).json({ message: "Co-author record not found" });
    }

    coAuthor.isAnswered = 1;
    await coAuthor.save();

    let invitationRecord = await invitation.findOne({
      where: {
        bookId,
        chapterId,
        questionId,
      },
    });

    if (!invitationRecord) {
      return res.status(400).json({ message: "Invitation record not found" });
    }

    invitationRecord.status = 1;
    await invitationRecord.save();

    res.json(existingAnswer);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};
