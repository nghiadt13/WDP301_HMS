const express = require('express');
const minibarController = require('./minibar.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.use(authMiddleware, authorize('manager'));

router.get('/minibar-items', minibarController.getMinibarItems);
router.post('/minibar-items', minibarController.createMinibarItem);
router.put('/minibar-items/:itemId', minibarController.updateMinibarItem);
router.patch('/minibar-items/:itemId/deactivate', minibarController.deactivateMinibarItem);
router.patch('/minibar-items/:itemId/activate', minibarController.activateMinibarItem);

module.exports = router;
