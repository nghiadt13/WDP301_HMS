const express = require('express');

const { changePassword, googleLogin, login, me, recentSessions, register, requestPasswordReset, resetPassword, logout, revokeSession } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/google', googleLogin);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, me);
router.patch('/change-password', authMiddleware, changePassword);
router.get('/sessions', authMiddleware, recentSessions);
router.post('/logout', authMiddleware, logout);
router.post('/sessions/:id/revoke', authMiddleware, revokeSession);

module.exports = router;
