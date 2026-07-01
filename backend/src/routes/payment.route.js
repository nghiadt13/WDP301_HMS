const express = require('express');

const { createVietQrPayment, getReservationPaymentStatus, handleCassoWebhook } = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/reservations/:reservationId/vietqr', authMiddleware, createVietQrPayment);
router.get('/reservations/:reservationId/status', authMiddleware, getReservationPaymentStatus);
router.post('/casso/webhook', handleCassoWebhook);

module.exports = router;
