const express = require('express');
const customerReservationController = require('./reservation.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');

const router = express.Router();

router.get('/:reservationId', authMiddleware, customerReservationController.getCustomerReservation);
router.patch('/:reservationId/cancel', authMiddleware, customerReservationController.cancelCustomerReservation);

module.exports = router;
