const customerFeedbackService = require('./customer-feedback.service');

const sendError = (res, err) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

const customerFeedbackController = {
  async getCustomerFeedbacks(req, res) {
    try {
      const data = await customerFeedbackService.getCustomerFeedbacks(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async respondCustomerFeedback(req, res) {
    try {
      const data = await customerFeedbackService.respondCustomerFeedback(req.params.feedbackId, req.body.responseText, req.user);
      res.status(200).json({ success: true, data, message: 'Feedback response sent successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async archiveCustomerFeedback(req, res) {
    try {
      const data = await customerFeedbackService.archiveCustomerFeedback(req.params.feedbackId);
      res.status(200).json({ success: true, data, message: 'Feedback archived successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },
};

module.exports = customerFeedbackController;
