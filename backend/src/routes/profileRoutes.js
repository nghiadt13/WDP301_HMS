const express = require('express');

const { getProfileDashboard } = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, getProfileDashboard);

module.exports = router;
