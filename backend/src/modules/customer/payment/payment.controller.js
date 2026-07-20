const paymentService = require('./payment.service');

const customerPaymentController = {
  createVnpayPayment(req, res, next) {
    return paymentService.createVnpayPayment(req, res, next);
  },

  getReservationPaymentStatus(req, res, next) {
    return paymentService.getReservationPaymentStatus(req, res, next);
  },

  getHotelPolicies(req, res, next) {
    return paymentService.getHotelPolicies(req, res, next);
  },

  handleVnpayReturn(req, res, next) {
    return paymentService.handleVnpayReturn(req, res, next);
  }
};

module.exports = customerPaymentController;
