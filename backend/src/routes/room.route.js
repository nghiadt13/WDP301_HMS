const express = require('express');
const roomController = require('../controllers/room.controller');
const { validateRoom } = require('../validators/room.validator');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

const router = express.Router();

// Public routes
router.get('/', roomController.getAll);
router.get('/:id', roomController.getById);

// Protected routes (mock auth for now)
router.post('/', auth, authorize('manager'), validateRoom, roomController.create);
router.put('/:id', auth, authorize('manager'), roomController.update);
router.delete('/:id', auth, authorize('manager'), roomController.remove);
router.delete('/:id/permanent', auth, authorize('manager'), roomController.hardDelete);

module.exports = router;
