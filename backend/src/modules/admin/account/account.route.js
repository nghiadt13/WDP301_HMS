const express = require('express');
const accountController = require('./account.controller');

const router = express.Router();

router.get('/', accountController.getAll);
router.get('/:id', accountController.getById);
router.post('/', accountController.create);
router.put('/:id', accountController.update);
router.put('/:id/reset-password', accountController.resetPassword);

module.exports = router;
