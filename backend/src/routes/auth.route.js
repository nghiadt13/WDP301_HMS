const express = require('express');

const {
  changePassword,
  googleLogin,
  login,
  me,
  register,
  requestPasswordReset,
  resetPassword
} = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/google', googleLogin);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, me);
router.patch('/change-password', authMiddleware, changePassword);

module.exports = router;
