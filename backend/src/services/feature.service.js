const Feature = require('../models/feature.model');

const featureService = {
  async getAll() {
    return await Feature.find({ is_active: true }).sort('name');
  },

  async getById(id) {
    const f = await Feature.findById(id);
    if (!f) throw { status: 404, message: 'Feature not found' };
    return f;
  },
};

module.exports = featureService;
