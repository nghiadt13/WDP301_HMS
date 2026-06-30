const roomService = require('../services/room.service');

const roomController = {
  async getAll(req, res) {
    try {
      const result = await roomService.getAll(req.query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },

  async getById(req, res) {
    try {
      const room = await roomService.getById(req.params.id);
      res.status(200).json({ success: true, data: room });
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },

  async create(req, res) {
    try {
      const room = await roomService.create(req.body);
      res.status(201).json({ success: true, data: room });
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },

  async update(req, res) {
    try {
      const room = await roomService.update(req.params.id, req.body);
      res.status(200).json({ success: true, data: room });
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },

  async remove(req, res) {
    try {
      await roomService.remove(req.params.id);
      res.status(200).json({ success: true, message: 'Room deleted successfully' });
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },

  async hardDelete(req, res) {
    try {
      await roomService.hardDelete(req.params.id);
      res.status(200).json({ success: true, message: 'Room permanently deleted' });
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },
};
f
module.exports = roomController;
