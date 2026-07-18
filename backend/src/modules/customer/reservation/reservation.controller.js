const reservationService = require('./reservation.service');

const customerReservationController = {
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

module.exports = customerReservationController;
