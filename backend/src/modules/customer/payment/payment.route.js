const express = require('express');
const customerPaymentController = require('./payment.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');

const router = express.Router();

router.get('/vnpay/return', customerPaymentController.handleVnpayReturn);
router.get('/hotel-policies', authMiddleware, customerPaymentController.getHotelPolicies);
router.post('/reservations/:reservationId/vnpay', authMiddleware, customerPaymentController.createVnpayPayment);
router.get('/reservations/:reservationId/status', authMiddleware, customerPaymentController.getReservationPaymentStatus);

module.exports = router;
