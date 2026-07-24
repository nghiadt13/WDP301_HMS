const express = require('express');
const featureController = require('./feature.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.get('/', authMiddleware, authorize('manager'), featureController.getAll);
router.get('/:id', authMiddleware, authorize('manager'), featureController.getById);

module.exports = router;
