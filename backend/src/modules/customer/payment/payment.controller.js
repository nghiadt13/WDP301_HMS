const paymentService = require('./payment.service');

const customerPaymentController = {
  createVietQrPayment(req, res, next) {
    return paymentService.createVietQrPayment(req, res, next);
  },

  getReservationPaymentStatus(req, res, next) {
    return paymentService.getReservationPaymentStatus(req, res, next);
  }
};

module.exports = customerPaymentController;
