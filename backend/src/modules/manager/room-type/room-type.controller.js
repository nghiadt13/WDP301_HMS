const roomTypeService = require('./room-type.service');

const roomTypeController = {
  async getAll(req, res) {
    try {
      const data = await roomTypeService.getAll();
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const data = await roomTypeService.getById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
    }
  },
};

module.exports = roomTypeController;
