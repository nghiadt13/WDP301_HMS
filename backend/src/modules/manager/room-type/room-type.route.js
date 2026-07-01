const express = require('express');
const roomTypeController = require('./room-type.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.get('/', authMiddleware, authorize('manager'), roomTypeController.getAll);
router.get('/:id', authMiddleware, authorize('manager'), roomTypeController.getById);

module.exports = router;
