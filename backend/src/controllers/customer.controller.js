const customerService = require('../services/customer.service');

const customerController = {
  cancelCustomerServiceRequest(req, res, next) {
    return customerService.cancelCustomerServiceRequest(req, res, next);
  },

  getHotelServiceDetail(req, res, next) {
    return customerService.getHotelServiceDetail(req, res, next);
  },

  listCustomerFeedbacks(req, res, next) {
    return customerService.listCustomerFeedbacks(req, res, next);
  },

  listCustomerServiceRequests(req, res, next) {
    return customerService.listCustomerServiceRequests(req, res, next);
  },

  listHotelServices(req, res, next) {
    return customerService.listHotelServices(req, res, next);
  },

  requestHotelService(req, res, next) {
    return customerService.requestHotelService(req, res, next);
  },

  sendCustomerFeedback(req, res, next) {
    return customerService.sendCustomerFeedback(req, res, next);
  },

  updateCustomerFeedback(req, res, next) {
    return customerService.updateCustomerFeedback(req, res, next);
  }
};

module.exports = customerController;

