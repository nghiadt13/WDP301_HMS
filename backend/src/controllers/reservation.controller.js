const reservationService = require('../services/reservation.service');

const reservationController = {
  cancelCustomerReservation(req, res, next) {
    return reservationService.cancelCustomerReservation(req, res, next);
  },

  createRoomBooking(req, res, next) {
    return reservationService.createRoomBooking(req, res, next);
  },

  getCustomerReservation(req, res, next) {
    return reservationService.getCustomerReservation(req, res, next);
  }
};

module.exports = reservationController;
