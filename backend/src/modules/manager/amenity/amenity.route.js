const express = require('express');
const amenityController = require('./amenity.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.get('/', authMiddleware, authorize('manager'), amenityController.getAll);
router.get('/:id', authMiddleware, authorize('manager'), amenityController.getById);

module.exports = router;
