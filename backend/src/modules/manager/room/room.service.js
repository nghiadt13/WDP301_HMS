const Room = require('../../../models/room.model');
require('../../../models/room-type.model');
const RoomInventoryItem = require('../../../models/roomInventoryItem.model');
const fs = require('fs');
const path = require('path');

// ========== Constants ==========
const POPULATE_OPTS = [
  { path: 'room_type_id', select: 'name description bed_type capacity base_price images features facilities' },
  { path: 'room_inventory.item_id', select: 'name category price stock_status description is_active' }
];

const BOOKING_ROOM_ORDER = [
  'PHONG DELUXE',
  'PHONG PREMIUM',
  'PHONG CLUB DELUXE TWIN',
  'PHONG CLUB PADDINGTON DELUXE',
  'PHONG GRAND SUITE',
  'PHONG PRESIDENT SUITE',
];

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

const normalizeRoomInventoryPayload = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    item_id: item.item_id?._id || item.item_id,
    quantity: Number(item.quantity ?? 0)
  }));
};

const fillRoomInventoryData = (room, activeRoomInventoryItems) => {
  if (!room) return room;
  const inventoryMap = new Map();
  const roomInventory = Array.isArray(room.room_inventory)
    ? room.room_inventory
    : [];
  
  roomInventory.forEach(entry => {
    const idStr = entry.item_id?._id?.toString() || entry.item_id?.toString();
    if (idStr) {
      inventoryMap.set(idStr, {
        item_id: entry.item_id,
        quantity: entry.quantity ?? 0
      });
    }
  });

  const completeRoomInventory = activeRoomInventoryItems.map(item => {
    const idStr = item._id.toString();
    if (inventoryMap.has(idStr)) {
      const existing = inventoryMap.get(idStr);
      return {
        item_id: existing.item_id || item,
        quantity: existing.quantity
      };
    } else {
      return {
        item_id: item,
        quantity: 0
      };
    }
  });

  return {
    ...room,
    room_inventory: completeRoomInventory
  };
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

    const activeRoomInventoryItems = await RoomInventoryItem.find({ is_active: true }).lean();
    const roomsWithInventory = rooms.map(room => fillRoomInventoryData(room, activeRoomInventoryItems));

    const sortedRooms = sortManagerRooms(roomsWithInventory);
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
    
    const activeRoomInventoryItems = await RoomInventoryItem.find({ is_active: true }).lean();
    const roomLean = room.toObject ? room.toObject() : room;
    return fillRoomInventoryData(roomLean, activeRoomInventoryItems);
  },

  async create(data) {
    const existing = await Room.findOne({ roomName: data.roomName });
    if (existing) throw { status: 409, message: 'Room name already exists' };

    const RoomType = require('../../../models/room-type.model');
    const roomType = await RoomType.findById(data.room_type_id);
    if (!roomType) throw { status: 400, message: 'Invalid room type ID' };

    const room = await Room.create(data);
    const populated = await room.populate(POPULATE_OPTS);
    
    const activeRoomInventoryItems = await RoomInventoryItem.find({ is_active: true }).lean();
    const roomLean = populated.toObject ? populated.toObject() : populated;
    return fillRoomInventoryData(roomLean, activeRoomInventoryItems);
  },

  async update(id, data) {
    const existingRoom = await Room.findById(id);
    if (!existingRoom) throw { status: 404, message: 'Room not found' };

    if (data.room_inventory && Array.isArray(data.room_inventory)) {
      data.room_inventory = normalizeRoomInventoryPayload(data.room_inventory);
    }

    const room = await Room.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate(POPULATE_OPTS);
    
    const activeRoomInventoryItems = await RoomInventoryItem.find({ is_active: true }).lean();
    const roomLean = room.toObject ? room.toObject() : room;
    return fillRoomInventoryData(roomLean, activeRoomInventoryItems);
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

    await Room.findByIdAndDelete(id);
    return { message: 'Room permanently deleted' };
  },
};

module.exports = managerRoomService;
