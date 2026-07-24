const express = require('express');
const roomInventoryController = require('./room-inventory.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/room-inventory-items', authorize('manager', 'housekeeping'), roomInventoryController.getRoomInventoryItems);
router.post('/room-inventory-items', authorize('manager'), roomInventoryController.createRoomInventoryItem);
router.put('/room-inventory-items/:itemId', authorize('manager'), roomInventoryController.updateRoomInventoryItem);
router.patch('/room-inventory-items/:itemId/deactivate', authorize('manager'), roomInventoryController.deactivateRoomInventoryItem);
router.patch('/room-inventory-items/:itemId/activate', authorize('manager'), roomInventoryController.activateRoomInventoryItem);

module.exports = router;
