const RoomType = require('../../../models/room-type.model');

const roomTypeService = {
  async getAll() {
    return await RoomType.find({ is_active: { $ne: false } }).sort('display_order name');
  },

  async getById(id) {
    const rt = await RoomType.findById(id);
    if (!rt || rt.is_active === false) throw { status: 404, message: 'Room type not found' };
    return rt;
  },

  async create(data) {
    const existing = await RoomType.findOne({ name: data.name, is_active: { $ne: false } });
    if (existing) throw { status: 409, message: 'Room type name already exists' };
    
    // Automatically set display order if not provided
    if (data.display_order === undefined) {
      const count = await RoomType.countDocuments({ is_active: { $ne: false } });
      data.display_order = count + 1;
    }
    
    return await RoomType.create(data);
  },

  async update(id, data) {
    const rt = await RoomType.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!rt) throw { status: 404, message: 'Room type not found' };
    return rt;
  },

  async remove(id) {
    const rt = await RoomType.findByIdAndUpdate(id, { is_active: false }, { new: true });
    if (!rt) throw { status: 404, message: 'Room type not found' };
    return rt;
  }
};

module.exports = roomTypeService;
