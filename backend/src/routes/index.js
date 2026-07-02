const express = require('express');

// Shared routes
const authRoutes = require('./auth.route');
const homeRoutes = require('./home.route');
const profileRoutes = require('./profile.route');
const uploadRoutes = require('./upload.route');
const managerRoutes = require('./manager.route');

// Public room routes (list, search, detail, calendar)
const publicRoomRoutes = require('./room.route');

// Manager modules
const managerRoomRoutes = require('../modules/manager/room/room.route');
const managerAmenityRoutes = require('../modules/manager/amenity/amenity.route');
const managerFeatureRoutes = require('../modules/manager/feature/feature.route');
const managerRoomTypeRoutes = require('../modules/manager/room-type/room-type.route');

// Customer modules
const customerReservationRoutes = require('../modules/customer/reservation/reservation.route');
const customerPaymentRoutes = require('../modules/customer/payment/payment.route');

// Shared webhook
const cassoWebhookRoutes = require('../modules/shared/webhook/casso-webhook.route');

const router = express.Router();

router.get('/health', (req, res) => {
  res.send({
    status: 'ok',
    service: 'wdp101-api'
  });
});

// Shared routes
router.use('/auth', authRoutes);
router.use('/home', homeRoutes);
router.use('/profile', profileRoutes);
router.use('/upload', uploadRoutes);
router.use('/manager', managerRoutes);

// Public room routes (no auth required)
router.use('/rooms', publicRoomRoutes);

// Manager routes (auth + role check inside each route)
router.use('/manager/rooms', managerRoomRoutes);
router.use('/manager/amenities', managerAmenityRoutes);
router.use('/manager/features', managerFeatureRoutes);
router.use('/manager/room-types', managerRoomTypeRoutes);

// Customer routes
router.use('/reservations', customerReservationRoutes);
router.use('/payments', customerPaymentRoutes);

// Shared webhook
router.use('/webhooks', cassoWebhookRoutes);

module.exports = router;
