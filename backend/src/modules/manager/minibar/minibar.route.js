const express = require('express');
const minibarController = require('./minibar.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/minibar-items', authorize('manager', 'housekeeping'), minibarController.getMinibarItems);
router.post('/minibar-items', authorize('manager'), minibarController.createMinibarItem);
router.put('/minibar-items/:itemId', authorize('manager'), minibarController.updateMinibarItem);
router.patch('/minibar-items/:itemId/deactivate', authorize('manager'), minibarController.deactivateMinibarItem);
router.patch('/minibar-items/:itemId/activate', authorize('manager'), minibarController.activateMinibarItem);

module.exports = router;
