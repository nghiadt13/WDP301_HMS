const express = require('express');

const { createRoomBooking } = require('../controllers/reservation.controller');
const { getRoomCalendar, getRoomDetail, listRooms, searchRooms, submitRoomReview } = require('../controllers/room.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', listRooms);
router.get('/search', searchRooms);
router.get('/:roomId/calendar', getRoomCalendar);
router.get('/:roomId', getRoomDetail);
router.post('/:roomId/bookings', authMiddleware, createRoomBooking);
router.post('/:roomId/reviews', authMiddleware, submitRoomReview);

module.exports = router;
