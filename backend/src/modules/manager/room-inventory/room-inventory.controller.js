const roomInventoryService = require('./room-inventory.service');

const sendError = (res, err) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

const roomInventoryController = {
  async getRoomInventoryItems(req, res) {
    try {
      const data = await roomInventoryService.getRoomInventoryItems(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async createRoomInventoryItem(req, res) {
    try {
      const data = await roomInventoryService.createRoomInventoryItem(req.body);
      res.status(201).json({ success: true, data, message: 'Room inventory item created successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async updateRoomInventoryItem(req, res) {
    try {
      const data = await roomInventoryService.updateRoomInventoryItem(req.params.itemId, req.body);
      res.status(200).json({ success: true, data, message: 'Room inventory item updated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async deactivateRoomInventoryItem(req, res) {
    try {
      const data = await roomInventoryService.deactivateRoomInventoryItem(req.params.itemId);
      res.status(200).json({ success: true, data, message: 'Room inventory item deactivated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async activateRoomInventoryItem(req, res) {
    try {
      const data = await roomInventoryService.activateRoomInventoryItem(req.params.itemId);
      res.status(200).json({ success: true, data, message: 'Room inventory item activated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },
};

module.exports = roomInventoryController;
