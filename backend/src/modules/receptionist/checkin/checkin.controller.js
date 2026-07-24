const checkinService = require('./checkin.service');

const checkinController = {
  async getBookings(req, res) {
    try {
      const result = await checkinService.getBookings(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },

  async getBookingById(req, res) {
    try {
      const result = await checkinService.getBookingById(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },

  async processCheckIn(req, res) {
    try {
      const result = await checkinService.processCheckIn(req.params.id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },

  async createWalkInBooking(req, res) {
    try {
      const result = await checkinService.createWalkInBooking(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },

  async confirmWalkInBooking(req, res) {
    try {
      const result = await checkinService.confirmWalkInBooking(req.params.id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },

  async getAvailableRooms(req, res) {
    try {
      const { roomTypeId, checkInDate, checkOutDate } = req.query;
      const rooms = await checkinService.getAvailableRooms(roomTypeId, checkInDate, checkOutDate);
      res.status(200).json({ success: true, data: rooms });
    } catch (err) {
      res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },

  async getRoomTypes(req, res) {
    try {
      const types = await checkinService.getRoomTypes();
      res.status(200).json({ success: true, data: types });
    } catch (err) {
      res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },

  async getDashboardStats(req, res) {
    try {
      const stats = await checkinService.getDashboardStats();
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      res.status(err.statusCode || err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  }
};

module.exports = checkinController;
