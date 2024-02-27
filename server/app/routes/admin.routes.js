const express = require('express');
const adminController = require('../controllers/admin.controller');

const router = express.Router();


router.post('/api/admin/Signin',adminController.adminSignIn);

router.get('/api/admin/Dashboard',adminController.cardsData);

//-----------------gift certificate------------------------

router.get('/api/admin/getGifts',adminController.getAllGiftCertificates);

router.delete('/api/admin/deleteGift/:id',adminController.deleteGiftCertificate);

//------------------promo code------------------------

router.get('/api/admin/getPromo',adminController.getAllPromoCodes);

router.post('/api/admin/createPromo',adminController.createPromoCodes);

router.delete('/api/admin/deletePromo/:id',adminController.deletePromoCodes);

//-----------------users-----------------------------

router.get('/api/admin/getAllUsers',adminController.getAllUsers);

//-------------------chapters--------------------------

router.get('/api/admin/getAllChapters',adminController.getAllChapters);

router.post('/api/admin/createChapter',adminController.createNonCustomChapter);

router.put('/api/admin/updateChapter',adminController.updateNonCustomChapter);

router.delete('/api/admin/deleteChapter/:id',adminController.deleteNonCustomChapter);

//---------------------Questions------------------------
router.get('/api/admin/getAllQuestions/:id',adminController.getAllQuestionsByChapter);

router.post('/api/admin/createQuestion',adminController.createNonCustomQuestion);

router.put('/api/admin/updateQuestion',adminController.updateNonCustomQuestion);

router.delete('/api/admin/deleteQuestion/:id',adminController.deleteNonCustomQuestion);

//-----------------------print book-------------------------

router.get('/api/admin/printBook',adminController.getAllPrintedBooks);

router.delete('/api/admin/deleteBook',adminController.deleteBook);

router.post('/api/admin/previewBook', adminController.previewBook)


module.exports = router;