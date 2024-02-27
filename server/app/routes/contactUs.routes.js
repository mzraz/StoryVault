const express = require('express');
const contactUsController = require('../controllers/contactUs.controller');

const router = express.Router();

router.post('/api/contactEmail', contactUsController.sendContactEmail);

router.post('/api/createContact', contactUsController.createContact);


module.exports = router;