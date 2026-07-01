const express = require('express');

const {
  cancelCustomerServiceRequest,
  getHotelServiceDetail,
  listCustomerFeedbacks,
  listCustomerServiceRequests,
  listHotelServices,
  requestHotelService,
  sendCustomerFeedback,
  updateCustomerFeedback
} = require('../controllers/customer.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/services', listHotelServices);
router.get('/services/:serviceId', getHotelServiceDetail);
router.post('/services/:serviceId/requests', requestHotelService);
router.get('/service-requests', listCustomerServiceRequests);
router.patch('/service-requests/:requestId/cancel', cancelCustomerServiceRequest);
router.get('/feedbacks', listCustomerFeedbacks);
router.post('/feedbacks', sendCustomerFeedback);
router.patch('/feedbacks/:feedbackId', updateCustomerFeedback);

module.exports = router;

