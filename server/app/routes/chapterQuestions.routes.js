const express = require('express');
const chapterQuestions = require('../controllers/chapterQuestions.controller');

const router = express.Router();
router.post('/saveWizard', chapterQuestions.saveWizard);
router.put('/create/answer', chapterQuestions.createAnswer);
router.get('/get/BookDataById/:bookId', chapterQuestions.getBookDataById);
router.put('/update/sequence', chapterQuestions.updateSequenceNumbers);
router.put('/coAuthor/answer', chapterQuestions.coAuthorAnswer);

module.exports = router;
