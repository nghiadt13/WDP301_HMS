const express = require('express');

const authMiddleware = require('../../../middlewares/auth.middleware');
const customerFeedbackController = require('./feedback.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/feedbacks', customerFeedbackController.listCustomerFeedbacks);
router.post('/feedbacks', customerFeedbackController.sendCustomerFeedback);
router.patch('/feedbacks/:feedbackId', customerFeedbackController.updateCustomerFeedback);

module.exports = router;
