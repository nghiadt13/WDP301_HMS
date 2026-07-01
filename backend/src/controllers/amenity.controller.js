const amenityService = require('../services/amenity.service');

const amenityController = {
  async getAll(req, res) {
    try {
      const data = await amenityService.getAll();
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const data = await amenityService.getById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
    }
  },
};

module.exports = amenityController;
