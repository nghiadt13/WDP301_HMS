const express = require('express');
const checkinController = require('./checkin.controller');
const { validateWalkIn, validateCheckIn } = require('./checkin.validator');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(authorize('receptionist'));

router.get('/bookings', checkinController.getBookings);
router.get('/bookings/:id', checkinController.getBookingById);
router.post('/bookings/:id/checkin', validateCheckIn, checkinController.processCheckIn);
router.post('/bookings/walkin', validateWalkIn, checkinController.createWalkInBooking);
router.get('/rooms/available', checkinController.getAvailableRooms);
router.get('/room-types', checkinController.getRoomTypes);
router.get('/dashboard-stats', checkinController.getDashboardStats);

module.exports = router;
