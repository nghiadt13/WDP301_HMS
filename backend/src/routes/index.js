const express = require('express');

const authRoutes = require('./authRoutes');
const homeRoutes = require('./homeRoutes');
const profileRoutes = require('./profileRoutes');
const reservationRoutes = require('./reservationRoutes');
const roomRoutes = require('./roomRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.send({
    status: 'ok',
    service: 'wdp101-api'
  });
});

router.use('/auth', authRoutes);
router.use('/home', homeRoutes);
router.use('/profile', profileRoutes);
router.use('/reservations', reservationRoutes);
router.use('/rooms', roomRoutes);

module.exports = router;
