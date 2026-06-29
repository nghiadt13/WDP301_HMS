const express = require('express');

const { createRoomBooking } = require('../controllers/reservationController');
const { getRoomCalendar, getRoomDetail, listRooms, searchRooms, submitRoomReview } = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', listRooms);
router.get('/search', searchRooms);
router.get('/:roomId/calendar', getRoomCalendar);
router.get('/:roomId', getRoomDetail);
router.post('/:roomId/bookings', authMiddleware, createRoomBooking);
router.post('/:roomId/reviews', authMiddleware, submitRoomReview);

module.exports = router;
