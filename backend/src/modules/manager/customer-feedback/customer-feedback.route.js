const express = require('express');
const customerFeedbackController = require('./customer-feedback.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.get('/customer-feedbacks', authMiddleware, authorize('manager'), customerFeedbackController.getCustomerFeedbacks);
router.patch('/customer-feedbacks/:feedbackId/respond', authMiddleware, authorize('manager'), customerFeedbackController.respondCustomerFeedback);

module.exports = router;
