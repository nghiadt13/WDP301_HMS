const express = require('express');

const authMiddleware = require('../../../middlewares/auth.middleware');
const customerFeedbackController = require('./feedback.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/feedback-status', customerFeedbackController.getFeedbackStatus);
router.get('/feedback-rooms', customerFeedbackController.listFeedbackRooms);
router.get('/feedbacks', customerFeedbackController.listCustomerFeedbacks);
router.post('/feedbacks', customerFeedbackController.sendCustomerFeedback);

module.exports = router;
