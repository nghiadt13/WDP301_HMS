const express = require('express');
const customerRoomService = require('../modules/customer/room/room.service');
const customerReservationController = require('../modules/customer/reservation/reservation.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes (no auth required)
router.get('/list', customerRoomService.listRooms);
router.get('/search', customerRoomService.searchRooms);
router.get('/:id', customerRoomService.getById);
router.get('/:id/calendar', customerRoomService.getRoomCalendar);
router.get('/:id/detail', customerRoomService.getRoomDetail);
router.post('/:roomId/bookings', authMiddleware, customerReservationController.createRoomBooking);

module.exports = router;
