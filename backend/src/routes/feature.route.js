const express = require('express');
const featureController = require('../controllers/feature.controller');

const router = express.Router();

router.get('/', featureController.getAll);
router.get('/:id', featureController.getById);

module.exports = router;
