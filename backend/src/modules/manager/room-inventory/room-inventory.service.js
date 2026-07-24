const RoomInventoryItem = require('../../../models/roomInventoryItem.model');

const createHttpError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const LOW_STOCK_THRESHOLD = 10;

const getStockStatusFromQuantity = (quantity) => {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'in_stock';
};

const isValidImageUrl = (value) => {
  const imageUrl = String(value || '').trim();
  if (!imageUrl || imageUrl.length > 2048) return false;

  // The upload endpoint verifies the real binary type, not only the file extension.
  return /^\/uploads\/rooms\/[a-z0-9_-]+\.(jpe?g|png|webp)$/i.test(imageUrl);
};

const buildRoomInventoryPayload = (data) => {
  const price = Number(data.price);
  const quantity = Number(data.quantity ?? 0);

  if (!String(data.name || '').trim()) {
    throw createHttpError('Vui long nhap ten vat tu phong.');
  }

  if (String(data.name).trim().length > 120) {
    throw createHttpError('Ten vat tu phong khong duoc vuot qua 120 ky tu.');
  }

  if (!String(data.category || '').trim()) {
    throw createHttpError('Vui long chon danh muc.');
  }

  if (String(data.category).trim().length > 80) {
    throw createHttpError('Danh muc khong duoc vuot qua 80 ky tu.');
  }

  if (!Number.isInteger(price) || price < 0 || price > 100000000) {
    throw createHttpError('Gia phai la so nguyen tu 0 den 100000000 VND.');
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw createHttpError('So luong phai la so nguyen khong am.');
  }

  if (quantity > 100000) {
    throw createHttpError('So luong vat tu khong duoc vuot qua 100000.');
  }

  const imageUrl = String(data.image_url || '').trim();
  if (!isValidImageUrl(imageUrl)) {
    throw createHttpError('Anh vat tu bat buoc phai duoc tai len va co dinh dang JPG, PNG hoac WebP hop le.');
  }

  const requestedStatus = data.stock_status;
  const calculatedStatus = getStockStatusFromQuantity(quantity);
  if (requestedStatus && requestedStatus !== calculatedStatus) {
    throw createHttpError('Trang thai ton kho khong khop voi so luong. He thong tu dong xac dinh trang thai theo so luong.');
  }

  return {
    name: String(data.name).trim(),
    category: String(data.category).trim(),
    price,
    quantity,
    stock_status: calculatedStatus,
    image_url: imageUrl,
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
