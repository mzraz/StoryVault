const { verifySignUp, authJwt } = require('../middleware');
const express = require('express');
const router = express.Router();
const { getQuestionsByChapterId, getQuestionByEmail } = require('../controllers/questions.controller');
const { addCustomQuestion } = require('../controllers/questions.controller');
const { deleteCustomQuestion } = require('../controllers/questions.controller');
const { updateCustomQuestion } = require('../controllers/questions.controller');

router.delete('/deleteCustomQuestion', deleteCustomQuestion);
router.post('/add-custom-question', addCustomQuestion);
router.post('/questions', getQuestionsByChapterId);
router.post('/api/updateCustomQuestion', updateCustomQuestion);
router.post('/questionByEmail', getQuestionByEmail);

module.exports = router;
