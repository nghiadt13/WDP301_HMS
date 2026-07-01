const express = require('express');
const managerRoomController = require('./room.controller');
const { validateRoom } = require('../../../validators/room.validator');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.get('/', authMiddleware, authorize('manager'), managerRoomController.getAll);
router.get('/:id', authMiddleware, authorize('manager'), managerRoomController.getById);
router.post('/', authMiddleware, authorize('manager'), validateRoom, managerRoomController.create);
router.put('/:id', authMiddleware, authorize('manager'), managerRoomController.update);
router.delete('/:id', authMiddleware, authorize('manager'), managerRoomController.remove);
router.delete('/:id/permanent', authMiddleware, authorize('manager'), managerRoomController.hardDelete);

module.exports = router;
