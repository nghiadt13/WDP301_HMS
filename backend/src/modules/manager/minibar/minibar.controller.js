const minibarService = require('./minibar.service');

const sendError = (res, err) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

const minibarController = {
  async getMinibarItems(req, res) {
    try {
      const data = await minibarService.getMinibarItems(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async createMinibarItem(req, res) {
    try {
      const data = await minibarService.createMinibarItem(req.body);
      res.status(201).json({ success: true, data, message: 'Minibar item created successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async updateMinibarItem(req, res) {
    try {
      const data = await minibarService.updateMinibarItem(req.params.itemId, req.body);
      res.status(200).json({ success: true, data, message: 'Minibar item updated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async deactivateMinibarItem(req, res) {
    try {
      const data = await minibarService.deactivateMinibarItem(req.params.itemId);
      res.status(200).json({ success: true, data, message: 'Minibar item deactivated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async activateMinibarItem(req, res) {
    try {
      const data = await minibarService.activateMinibarItem(req.params.itemId);
      res.status(200).json({ success: true, data, message: 'Minibar item activated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },
};

module.exports = minibarController;
