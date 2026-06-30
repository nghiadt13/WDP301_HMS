const express = require('express');

const { changePassword, googleLogin, login, me, register } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/google', googleLogin);
router.get('/me', authMiddleware, me);
router.patch('/change-password', authMiddleware, changePassword);

module.exports = router;
