const express = require('express');

const { cancelCustomerReservation, getCustomerReservation } = require('../controllers/reservationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:reservationId', authMiddleware, getCustomerReservation);
router.patch('/:reservationId/cancel', authMiddleware, cancelCustomerReservation);

module.exports = router;
