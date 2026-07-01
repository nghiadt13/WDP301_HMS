const paymentService = require('../services/payment.service');

const paymentController = {
  createVietQrPayment(req, res, next) {
    return paymentService.createVietQrPayment(req, res, next);
  },

  getReservationPaymentStatus(req, res, next) {
    return paymentService.getReservationPaymentStatus(req, res, next);
  },

  handleCassoWebhook(req, res, next) {
    return paymentService.handleCassoWebhook(req, res, next);
  }
};

module.exports = paymentController;
