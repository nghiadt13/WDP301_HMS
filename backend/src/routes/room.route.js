const express = require('express');
const customerReservationController = require('../modules/customer/reservation/reservation.controller');
const customerRoomService = require('../modules/customer/room/room.service');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes (no auth required)
router.get('/list', customerRoomService.listRooms);
router.get('/search', customerRoomService.searchRooms);
router.post('/:roomId/bookings', authMiddleware, customerReservationController.createRoomBooking);
router.get('/:id', customerRoomService.getById);
router.get('/:id/calendar', customerRoomService.getRoomCalendar);
router.get('/:id/detail', customerRoomService.getRoomDetail);

module.exports = router;
