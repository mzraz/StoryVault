const express = require('express');
const voucherController = require('../controllers/voucher.controller');

const router = express.Router();

router.post('/api/create/voucher', voucherController.createVoucher);

router.post('/api/upload/voucher', voucherController.uploadVoucherFile);

router.post('/api/payment/voucher', voucherController.paymentIntentvoucher);

router.post('/api/email/voucher', voucherController.sendVoucherEmail);

router.post('/api/createPayment', voucherController.createpayment);

router.post('/api/upload/pdfVoucher', voucherController.vouchertoPdf);

router.post('/api/check/voucherValidity', voucherController.checkVoucherValidity);

router.post('/api/update/voucherStatus', voucherController.checkoutVoucherStatusUpdate);

router.post('/api/checkout/promocode', voucherController.checkoutPromotionVoucher);

module.exports = router;