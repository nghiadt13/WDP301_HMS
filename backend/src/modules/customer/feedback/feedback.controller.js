const customerFeedbackService = require('./feedback.service');

const customerFeedbackController = {
  async listFeedbackRooms(req, res, next) {
    try {
      const rooms = await customerFeedbackService.listFeedbackRooms(req.user);
      res.status(200).send({ rooms });
    } catch (error) {
      next(error);
    }
  },

  async listCustomerFeedbacks(req, res, next) {
    try {
      const feedbacks = await customerFeedbackService.listCustomerFeedbacks(req.user);
      res.status(200).send({ feedbacks });
    } catch (error) {
      next(error);
    }
  },

  async sendCustomerFeedback(req, res, next) {
    try {
      const feedback = await customerFeedbackService.sendCustomerFeedback(req.body, req.user);
      res.status(201).send({
        message: 'Cảm ơn bạn. Góp ý của bạn đã được gửi đến quản lý.',
        feedback,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateCustomerFeedback(req, res, next) {
    try {
      const feedback = await customerFeedbackService.updateCustomerFeedback(req.params.feedbackId, req.body, req.user);
      res.status(200).send({
        message: 'Góp ý của bạn đã được cập nhật và gửi đến quản lý.',
        feedback,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = customerFeedbackController;