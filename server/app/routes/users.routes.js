const express = require('express');
const userController = require('../controllers/users.controller');

const router = express.Router();

router.post('/signup', userController.signUp);

router.post('/signup/verifyEmail', userController.verifyEmail);

router.post('/signup/verifyUsername', userController.verifyUsername);

router.post('/forgetpassword/verifyForgetEmail', userController.verifyForgetEmail);

router.post('/login', userController.login);

router.put('/verification', userController.verifyUser);

router.post('/users/invite', userController.sendInvitationEmail);

router.post('/upload/image', userController.uploadFile);

router.get('/file/url/:key', userController.getFileUrl);

router.get('/users/getstatus/:awsUserId', userController.getUserStatus);

router.post('/api/checkout/stripePayment', userController.checkoutStripePayment);

router.post('/api/getToken', userController.getToken);

router.post('/api/update/userStatus', userController.updateUserStatus);

router.post('/api/welcomeEmail', userController.sendWelcomeEmail);

router.post('/api/upload/UserImage', userController.uploadImageS3);

router.post('/api/update/UserImage', userController.updateUserImage);

router.post('/api/deleteBook', userController.deleteUser);

router.post('/api/deleteUser', userController.deleteCognitoUser);

router.post('/api/userMatch',userController.userMatch);

module.exports = router;