const express = require('express');

const authMiddleware = require('../../../middlewares/auth.middleware');
const customerServiceController = require('./service.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/services', customerServiceController.listHotelServices);
router.get('/services/:serviceId', customerServiceController.getHotelServiceDetail);
router.post('/services/:serviceId/requests', customerServiceController.requestHotelService);
router.get('/service-requests', customerServiceController.listCustomerServiceRequests);
router.patch('/service-requests/:requestId/cancel', customerServiceController.cancelCustomerServiceRequest);

module.exports = router;
