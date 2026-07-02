const RoomType = require('../../../models/room-type.model');

const roomTypeService = {
  async getAll() {
    return await RoomType.find({ is_active: true }).sort('name');
  },

  async getById(id) {
    const rt = await RoomType.findById(id);
    if (!rt) throw { status: 404, message: 'Room type not found' };
    return rt;
  },
};

module.exports = roomTypeService;
