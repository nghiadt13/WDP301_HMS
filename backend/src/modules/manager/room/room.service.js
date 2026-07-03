const Room = require('../../../models/room.model');
require('../../../models/room-type.model');
require('../../../models/amenity.model');
require('../../../models/feature.model');
const fs = require('fs');
const path = require('path');

// ========== Constants ==========
const POPULATE_OPTS = [
  { path: 'room_type_id', select: 'name description bed_type capacity base_price images' },
  { path: 'amenity_ids', select: 'name description' },
  { path: 'feature_ids', select: 'name description' },
];

const BOOKING_ROOM_ORDER = [
  'PHONG DELUXE',
  'PHONG PREMIUM',
  'PHONG CLUB DELUXE TWIN',
  'PHONG CLUB PADDINGTON DELUXE',
  'PHONG GRAND SUITE',
  'PHONG PRESIDENT SUITE',
];

// ========== Utility ==========
const deleteImageFiles = async (imageUrls) => {
  if (!imageUrls || !Array.isArray(imageUrls)) return;
  const uploadDir = path.join(__dirname, '../../../../uploads/rooms');
  for (const url of imageUrls) {
    const filename = url.split('/').pop();
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

const getBookingRoomOrder = (roomName = '') => {
  const normalizedName = String(roomName).trim().toUpperCase();
  const index = BOOKING_ROOM_ORDER.indexOf(normalizedName);
  return index === -1 ? BOOKING_ROOM_ORDER.length : index;
};

const sortManagerRooms = (rooms) => {
  return [...rooms].sort((firstRoom, secondRoom) => {
    const firstName = String(firstRoom.roomName || '');
    const secondName = String(secondRoom.roomName || '');
    const firstIsBookingRoom = /^PHONG /i.test(firstName);
    const secondIsBookingRoom = /^PHONG /i.test(secondName);

    if (firstIsBookingRoom !== secondIsBookingRoom) {
      return firstIsBookingRoom ? -1 : 1;
    }

    if (firstIsBookingRoom && secondIsBookingRoom) {
      return getBookingRoomOrder(firstName) - getBookingRoomOrder(secondName);
    }

    return firstName.localeCompare(secondName, 'en', { numeric: true, sensitivity: 'base' });
  });
};

// ========== Manager Room CRUD ==========
const managerRoomService = {
  async getAll(query) {
    const {
      roomTypeId,
      status,
      isActive,
      page = 1,
      limit = 10,
    } = query;

    const filter = {};
    filter.isActive = isActive !== undefined ? isActive === 'true' : true;

    if (roomTypeId) filter.room_type_id = roomTypeId;
    if (status) filter.status = status;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [rooms, total] = await Promise.all([
      Room.find(filter)
        .populate(POPULATE_OPTS)
        .lean(),
      Room.countDocuments(filter),
    ]);

    const sortedRooms = sortManagerRooms(rooms);
    const pagedRooms = sortedRooms.slice(skip, skip + limitNumber);

    return {
      data: pagedRooms,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  },

  async getById(id) {
    const room = await Room.findById(id).populate(POPULATE_OPTS);
    if (!room) throw { status: 404, message: 'Room not found' };
    return room;
  },

  async create(data) {
    const existing = await Room.findOne({ roomName: data.roomName });
    if (existing) throw { status: 409, message: 'Room name already exists' };
    const room = await Room.create(data);
    return await room.populate(POPULATE_OPTS);
  },

  async update(id, data) {
    const existingRoom = await Room.findById(id);
    if (!existingRoom) throw { status: 404, message: 'Room not found' };

    const existingImages = existingRoom.images || [];
    const newImages = data.images || [];
    const removedImages = existingImages.filter((img) => !newImages.includes(img));

    await deleteImageFiles(removedImages);

    const room = await Room.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate(POPULATE_OPTS);
    return room;
  },

  async remove(id) {
    const room = await Room.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!room) throw { status: 404, message: 'Room not found' };
    return room;
  },

  async hardDelete(id) {
    const room = await Room.findById(id);
    if (!room) throw { status: 404, message: 'Room not found' };

    await deleteImageFiles(room.images);
    await Room.findByIdAndDelete(id);
    return { message: 'Room permanently deleted' };
  },
};

module.exports = managerRoomService;
