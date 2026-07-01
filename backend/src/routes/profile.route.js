const express = require('express');

const { getProfileDashboard } = require('../controllers/profile.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/me', authMiddleware, getProfileDashboard);

module.exports = router;
