const managerRoomService = require('./room.service');

const managerRoomController = {
  async getAll(req, res) {
    try {
      const result = await managerRoomService.getAll(req.query);
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
      const room = await managerRoomService.getById(req.params.id);
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
      const room = await managerRoomService.create(req.body);
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
      const room = await managerRoomService.update(req.params.id, req.body);
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
      await managerRoomService.remove(req.params.id);
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
      await managerRoomService.hardDelete(req.params.id);
      res.status(200).json({ success: true, message: 'Room permanently deleted' });
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    }
  },
};

module.exports = managerRoomController;
