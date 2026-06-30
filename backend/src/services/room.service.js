const Room = require('../models/room.model');
const fs = require('fs');
const path = require('path');

const POPULATE_OPTS = [
  { path: 'room_type_id', select: 'name description bed_type capacity base_price images' },
  { path: 'amenity_ids', select: 'name description' },
  { path: 'feature_ids', select: 'name description' },
];

/** Delete image files from disk given an array of URLs */
const deleteImageFiles = async (imageUrls) => {
  if (!imageUrls || !Array.isArray(imageUrls)) return;
  const uploadDir = path.join(__dirname, '../../uploads/rooms');
  for (const url of imageUrls) {
    const filename = url.split('/').pop();
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

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
    // Find existing room to detect removed images
    const existingRoom = await Room.findById(id);
    if (!existingRoom) throw { status: 404, message: 'Room not found' };

    // Find images that were removed during edit
    const existingImages = existingRoom.images || [];
    const newImages = data.images || [];
    const removedImages = existingImages.filter((img) => !newImages.includes(img));

    // Delete removed image files from disk
    await deleteImageFiles(removedImages);

    const room = await Room.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate(POPULATE_OPTS);
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

  // Hard delete room (permanently remove from DB and delete image files)
  async hardDelete(id) {
    const room = await Room.findById(id);
    if (!room) throw { status: 404, message: 'Room not found' };

    // Delete image files from disk
    await deleteImageFiles(room.images);

    // Remove from database
    await Room.findByIdAndDelete(id);
    return { message: 'Room permanently deleted' };
  },
};

module.exports = roomService;
