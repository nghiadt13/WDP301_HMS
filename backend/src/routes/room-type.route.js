const express = require('express');
const roomTypeController = require('../controllers/room-type.controller');

const router = express.Router();

router.get('/', roomTypeController.getAll);
router.get('/:id', roomTypeController.getById);

module.exports = router;
