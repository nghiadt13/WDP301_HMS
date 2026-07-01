const express = require('express');
const amenityController = require('../controllers/amenity.controller');

const router = express.Router();

router.get('/', amenityController.getAll);
router.get('/:id', amenityController.getById);

module.exports = router;
