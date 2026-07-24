const express = require('express');
const customerFeedbackController = require('./customer-feedback.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.use(authMiddleware, authorize('manager'));

router.get('/customer-feedbacks', customerFeedbackController.getCustomerFeedbacks);
router.patch('/customer-feedbacks/:feedbackId/respond', customerFeedbackController.respondCustomerFeedback);

module.exports = router;
