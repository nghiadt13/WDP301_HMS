const featureService = require('../services/feature.service');

const featureController = {
  async getAll(req, res) {
    try {
      const data = await featureService.getAll();
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const data = await featureService.getById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
    }
  },
};

module.exports = featureController;
