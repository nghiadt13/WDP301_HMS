const Room = require('../models/room.model');

const POPULATE_OPTS = [
  { path: 'room_type_id', select: 'name description bed_type capacity base_price images' },
  { path: 'amenity_ids', select: 'name description' },
  { path: 'feature_ids', select: 'name description' },
];

const roomService = {
  // Get all rooms with filter, sort, pagination
  async getAll(query) {
    const {
      roomTypeId,
      status,
      isActive,
      page = 1,
      limit = 10,
      sort = '-createdAt',
    } = query;

    const filter = {};

    // Default: only show active rooms
    filter.isActive = isActive !== undefined ? isActive === 'true' : true;

    if (roomTypeId) filter.room_type_id = roomTypeId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [rooms, total] = await Promise.all([
      Room.find(filter)
        .populate(POPULATE_OPTS)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Room.countDocuments(filter),
    ]);

    return {
      data: rooms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  },

  // Get single room by ID
  async getById(id) {
    const room = await Room.findById(id).populate(POPULATE_OPTS);
    if (!room) throw { status: 404, message: 'Room not found' };
    return room;
  },

  // Create new room
  async create(data) {
    const existing = await Room.findOne({ roomName: data.roomName });
    if (existing) throw { status: 409, message: 'Room name already exists' };
    const room = await Room.create(data);
    return await room.populate(POPULATE_OPTS);
  },

  // Update room
  async update(id, data) {
    const room = await Room.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate(POPULATE_OPTS);
    if (!room) throw { status: 404, message: 'Room not found' };
    return room;
  },

  // Soft delete room
  async remove(id) {
    const room = await Room.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!room) throw { status: 404, message: 'Room not found' };
    return room;
  },
};

module.exports = roomService;
