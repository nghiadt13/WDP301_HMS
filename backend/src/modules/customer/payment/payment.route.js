const express = require('express');
const customerPaymentController = require('./payment.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');

const router = express.Router();

router.post('/reservations/:reservationId/mock', authMiddleware, customerPaymentController.createMockPayment);
router.post('/reservations/:reservationId/vietqr', authMiddleware, customerPaymentController.createVietQrPayment);
router.get('/reservations/:reservationId/status', authMiddleware, customerPaymentController.getReservationPaymentStatus);

module.exports = router;
