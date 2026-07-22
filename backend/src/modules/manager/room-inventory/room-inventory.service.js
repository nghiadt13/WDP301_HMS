const RoomInventoryItem = require('../../../models/roomInventoryItem.model');

const createHttpError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const buildRoomInventoryPayload = (data) => {
  const price = Number(data.price);
  const quantity = Number(data.quantity ?? 0);

  if (!String(data.name || '').trim()) {
    throw createHttpError('Vui long nhap ten vat tu phong.');
  }

  if (!String(data.category || '').trim()) {
    throw createHttpError('Vui long chon danh muc.');
  }

  if (!Number.isFinite(price) || price < 0) {
    throw createHttpError('Gia khong duoc nho hon 0.');
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw createHttpError('So luong phai la so nguyen khong am.');
  }

  return {
    name: String(data.name).trim(),
    category: String(data.category).trim(),
    price,
    quantity,
    stock_status: data.stock_status || 'in_stock',
    image_url: String(data.image_url || '').trim(),
    description: String(data.description || '').trim(),
  };
};

const roomInventoryService = {
  async getRoomInventoryItems(query = {}) {
    const filter = {};
    if (query.stock_status) filter.stock_status = query.stock_status;
    if (query.is_active !== undefined) filter.is_active = query.is_active === 'true';
    return RoomInventoryItem.find(filter).sort({ createdAt: -1 });
  },

  async createRoomInventoryItem(data) {
    return RoomInventoryItem.create(buildRoomInventoryPayload(data));
  },

  async updateRoomInventoryItem(id, data) {
    const item = await RoomInventoryItem.findByIdAndUpdate(id, buildRoomInventoryPayload(data), { new: true, runValidators: true });
    if (!item) throw createHttpError('Khong tim thay vat tu phong.', 404);
    return item;
  },

  async deactivateRoomInventoryItem(id) {
    const item = await RoomInventoryItem.findByIdAndUpdate(id, { is_active: false }, { new: true, runValidators: true });
    if (!item) throw createHttpError('Khong tim thay vat tu phong.', 404);
    return item;
  },

  async activateRoomInventoryItem(id) {
    const item = await RoomInventoryItem.findByIdAndUpdate(id, { is_active: true }, { new: true, runValidators: true });
    if (!item) throw createHttpError('Khong tim thay vat tu phong.', 404);
    return item;
  },
};

module.exports = roomInventoryService;
