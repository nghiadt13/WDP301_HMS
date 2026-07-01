const express = require('express');

const authRoutes = require('./auth.route');
const homeRoutes = require('./home.route');
const paymentRoutes = require('./payment.route');
const profileRoutes = require('./profile.route');
const reservationRoutes = require('./reservation.route');
const roomRoutes = require('./room.route');
const roomTypeRoutes = require('./room-type.route');
const amenityRoutes = require('./amenity.route');
const featureRoutes = require('./feature.route');
const uploadRoutes = require('./upload.route');

const router = express.Router();

router.get('/health', (req, res) => {
  res.send({
    status: 'ok',
    service: 'wdp101-api'
  });
});

router.use('/auth', authRoutes);
router.use('/home', homeRoutes);
router.use('/payments', paymentRoutes);
router.use('/profile', profileRoutes);
router.use('/reservations', reservationRoutes);
router.use('/rooms', roomRoutes);
router.use('/room-types', roomTypeRoutes);
router.use('/amenities', amenityRoutes);
router.use('/features', featureRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
