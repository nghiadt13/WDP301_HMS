const express = require('express');
const roomController = require('../controllers/room.controller');
const { validateRoom } = require('../validators/room.validator');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const { createRoomBooking } = require('../controllers/reservation.controller');

const router = express.Router();

// Public routes
router.get('/', roomController.getAll);
router.get('/list', roomController.listRooms);
router.get('/search', roomController.searchRooms);
router.get('/:id', roomController.getRoomDetail || roomController.getById);
router.get('/:id/calendar', roomController.getRoomCalendar);

// Protected routes (manager)
router.post('/', authMiddleware, authorize('manager'), validateRoom, roomController.create);
router.put('/:id', authMiddleware, authorize('manager'), roomController.update);
router.delete('/:id', authMiddleware, authorize('manager'), roomController.remove);
router.delete('/:id/permanent', authMiddleware, authorize('manager'), roomController.hardDelete);

// Protected routes (customer)
router.post('/:id/bookings', authMiddleware, createRoomBooking);
router.post('/:id/reviews', authMiddleware, roomController.submitRoomReview);

module.exports = router;
