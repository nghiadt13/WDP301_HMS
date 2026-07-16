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

  async create(req, res) {
    try {
      const data = await roomTypeService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
    }
  },

  async update(req, res) {
    try {
      const data = await roomTypeService.update(req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
    }
  },

  async remove(req, res) {
    try {
      await roomTypeService.remove(req.params.id);
      res.status(200).json({ success: true, message: 'Room type deleted successfully' });
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
    }
  }
};

module.exports = roomTypeController;
