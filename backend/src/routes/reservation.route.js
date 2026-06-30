const express = require('express');

const { cancelCustomerReservation, getCustomerReservation } = require('../controllers/reservation.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/:reservationId', authMiddleware, getCustomerReservation);
router.patch('/:reservationId/cancel', authMiddleware, cancelCustomerReservation);

module.exports = router;
