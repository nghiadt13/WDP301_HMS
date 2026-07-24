const express = require('express');

const { getProfileDashboard, updateProfile } = require('../controllers/profile.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/me', authMiddleware, getProfileDashboard);
router.patch('/me', authMiddleware, updateProfile);

module.exports = router;
