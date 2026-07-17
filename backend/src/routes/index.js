const express = require('express');

// Shared routes
const authRoutes = require('./auth.route');
const homeRoutes = require('./home.route');
const profileRoutes = require('./profile.route');
const policyRoutes = require('./policy.route');
const uploadRoutes = require('./upload.route');

// Manager sub-modules
const managerStaffTaskRoutes = require('../modules/manager/staff-task/staff-task.route');
const managerMinibarRoutes = require('../modules/manager/minibar/minibar.route');
const managerCustomerFeedbackRoutes = require('../modules/manager/customer-feedback/customer-feedback.route');
const managerDashboardRoutes = require('../modules/manager/dashboard/dashboard.route');
const managerPolicyRoutes = require('../modules/manager/policy/policy.route');

// Public room routes (list, search, detail, calendar)
const publicRoomRoutes = require('./room.route');

// Manager modules
const managerRoomRoutes = require('../modules/manager/room/room.route');
const managerAmenityRoutes = require('../modules/manager/amenity/amenity.route');
const managerFeatureRoutes = require('../modules/manager/feature/feature.route');
const managerRoomTypeRoutes = require('../modules/manager/room-type/room-type.route');

// Admin modules
const adminAccountRoutes = require('../modules/admin/account/account.route');
const adminRoleRoutes = require('../modules/admin/role/role.route');
const adminDashboardRoutes = require('../modules/admin/dashboard/dashboard.route');

// Customer modules
const customerReservationRoutes = require('../modules/customer/reservation/reservation.route');
const customerPaymentRoutes = require('../modules/customer/payment/payment.route');
const customerFeedbackRoutes = require('../modules/customer/feedback/feedback.route');

// Receptionist modules
const receptionistCheckinRoutes = require('../modules/receptionist/checkin/checkin.route');
const receptionistCheckoutRoutes = require('../modules/receptionist/checkout/checkout.route');


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
router.use('/policies', policyRoutes);
router.use('/upload', uploadRoutes);

// Manager operation sub-routes (mounted on /manager)
router.use('/manager', managerStaffTaskRoutes);
router.use('/manager', managerMinibarRoutes);
router.use('/manager', managerCustomerFeedbackRoutes);
router.use('/manager', managerPolicyRoutes);


// Public room routes (no auth required)
router.use('/rooms', publicRoomRoutes);

// Manager routes (auth + role check inside each route)
router.use('/manager/rooms', managerRoomRoutes);
router.use('/manager/amenities', managerAmenityRoutes);
router.use('/manager/features', managerFeatureRoutes);
router.use('/manager/room-types', managerRoomTypeRoutes);

// Admin routes (requires auth + admin role)
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

router.use('/admin/accounts', authMiddleware, authorize('admin'), adminAccountRoutes);
router.use('/admin/roles', authMiddleware, authorize('admin'), adminRoleRoutes);
router.use('/admin/dashboard', authMiddleware, authorize('admin'), adminDashboardRoutes);

// Manager dashboard
router.use('/manager/dashboard', authMiddleware, authorize('manager', 'admin'), managerDashboardRoutes);

// Customer routes
router.use('/reservations', customerReservationRoutes);
router.use('/payments', customerPaymentRoutes);
router.use('/customer', customerFeedbackRoutes);

// Receptionist routes
// Receptionist routes
router.use('/receptionist', receptionistCheckinRoutes);
router.use('/receptionist/checkout', receptionistCheckoutRoutes);


// Shared webhook
router.use('/webhooks', cassoWebhookRoutes);

module.exports = router;

