const Amenity = require('../models/amenity.model');

const amenityService = {
  async getAll() {
    return await Amenity.find({ is_active: true }).sort('name');
  },

  async getById(id) {
    const a = await Amenity.findById(id);
    if (!a) throw { status: 404, message: 'Amenity not found' };
    return a;
  },
};

module.exports = amenityService;
