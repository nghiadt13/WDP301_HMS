const express = require('express');
const roomTypeController = require('./room-type.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.get('/', authMiddleware, authorize('manager'), roomTypeController.getAll);
router.get('/:id', authMiddleware, authorize('manager'), roomTypeController.getById);
router.post('/', authMiddleware, authorize('manager'), roomTypeController.create);
router.put('/:id', authMiddleware, authorize('manager'), roomTypeController.update);
router.delete('/:id', authMiddleware, authorize('manager'), roomTypeController.remove);

module.exports = router;
