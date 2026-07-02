const mongoose = require('mongoose');

const CustomerServiceRequest = require('../../../models/customerServiceRequest.model');
const HotelService = require('../../../models/hotelService.model');
const { createHttpError } = require('../../../utils/error.utils');

const { ObjectId } = mongoose.Types;

const serviceFallbacks = [
  {
    id: 'room-dining',
    name: 'Dịch vụ ăn uống tại phòng',
    category: 'Ăn uống',
    description: 'Đặt món ăn, đồ ăn nhẹ và đồ uống giao trực tiếp đến phòng.',
    price: 0,
    available_time: '10:00 - 22:00',
    image_key: 'dining',
    is_active: true,
  },
  {
    id: 'housekeeping-request',
    name: 'Yêu cầu dọn phòng',
    category: 'Dọn phòng',
    description: 'Yêu cầu dọn phòng, thay khăn, thay ga giường hoặc bổ sung tiện nghi.',
    price: 0,
    available_time: '24/7',
    image_key: 'housekeeping',
    is_active: true,
  },
  {
    id: 'laundry-pressing',
    name: 'Giặt ủi',
    category: 'Giặt ủi',
    description: 'Dịch vụ giặt, sấy, ủi và giặt nhanh cho khách đang lưu trú.',
    price: 50000,
    available_time: '08:00 - 20:00',
    image_key: 'laundry',
    is_active: true,
  },
  {
    id: 'maintenance-support',
    name: 'Hỗ trợ kỹ thuật',
    category: 'Kỹ thuật',
    description: 'Báo sự cố điều hòa, đèn, nước, két an toàn hoặc thiết bị trong phòng.',
    price: 0,
    available_time: '24/7',
    image_key: 'maintenance',
    is_active: true,
  },
  {
    id: 'amenities-request',
    name: 'Yêu cầu vật dụng phòng',
    category: 'Vật dụng phòng',
    description: 'Yêu cầu thêm nước, đồ vệ sinh cá nhân, gối, chăn, dép hoặc bộ chuyển đổi.',
    price: 0,
    available_time: '24/7',
    image_key: 'amenities',
    is_active: true,
  },
  {
    id: 'airport-transfer',
    name: 'Đưa đón sân bay',
    category: 'Di chuyển',
    description: 'Đặt dịch vụ đưa đón riêng giữa khách sạn và sân bay.',
    price: 450000,
    available_time: 'Theo yêu cầu',
    image_key: 'transport',
    is_active: true,
  },
  {
    id: 'foot-soak-therapy',
    name: 'Ngâm chân thư giãn',
    category: 'Thư giãn & Spa',
    description: 'Thư giãn với dịch vụ ngâm chân thảo mộc sau khi di chuyển hoặc một ngày dài.',
    price: 120000,
    available_time: '14:00 - 22:00',
    image_key: 'spa',
    is_active: true,
  },
  {
    id: 'relaxing-massage',
    name: 'Mát xa thư giãn',
    category: 'Thư giãn & Spa',
    description: 'Đặt lịch mát xa toàn thân thư giãn do nhân viên spa của khách sạn phục vụ.',
    price: 350000,
    available_time: '14:00 - 22:00',
    image_key: 'spa',
    is_active: true,
  },
];

const mapHotelService = (service) => ({
  id: String(service._id || service.id),
  name: service.name,
  category: service.category,
  description: service.description || '',
  price: Number(service.price || 0),
  availableTime: service.available_time || '',
  imageUrl: service.image_url || '',
  imageKey: service.image_key || '',
  isActive: service.is_active !== false,
});

const mapServiceRequest = (request) => ({
  id: String(request._id),
  serviceId: request.hotel_service_id ? String(request.hotel_service_id) : request.service_code || '',
  serviceName: request.service_name,
  serviceCategory: request.service_category || '',
  roomNumber: request.room_number,
  note: request.note || '',
  status: request.status,
  requestedAt: request.requested_at,
  canceledAt: request.canceled_at,
  handledAt: request.handled_at,
});

const findServiceById = async (serviceId) => {
  let service = serviceFallbacks.find((item) => item.id === serviceId);

  if (!service && ObjectId.isValid(serviceId)) {
    service = await HotelService.findOne({
      _id: new ObjectId(serviceId),
      is_active: { $ne: false },
    }).lean();
  }

  return service;
};

const serviceModule = {
  async listHotelServices() {
    const services = await HotelService.find({ is_active: { $ne: false } }).sort({ category: 1, name: 1 }).lean();
    return (services.length > 0 ? services : serviceFallbacks).map(mapHotelService);
  },

  async getHotelServiceDetail(serviceId) {
    const service = await findServiceById(serviceId);
    if (!service) throw createHttpError('Không tìm thấy dịch vụ khách sạn.', 404);
    return mapHotelService(service);
  },

  async listCustomerServiceRequests(user) {
    const requests = await CustomerServiceRequest.find({ customer_id: user._id }).sort({ requested_at: -1 }).lean();
    return requests.map(mapServiceRequest);
  },

  async requestHotelService(serviceId, body, user) {
    const service = await findServiceById(serviceId);
    if (!service) throw createHttpError('Không tìm thấy dịch vụ khách sạn.', 404);

    const roomNumber = String(body.roomNumber || body.room_number || '').trim();
    const note = String(body.note || '').trim();

    if (!/^[A-Za-z0-9-]{1,12}$/.test(roomNumber)) {
      throw createHttpError('Vui lòng nhập số phòng hợp lệ.');
    }

    if (note.length > 500) {
      throw createHttpError('Ghi chú yêu cầu dịch vụ không được vượt quá 500 ký tự.');
    }

    const request = await CustomerServiceRequest.create({
      customer_id: user._id,
      hotel_service_id: service._id || null,
      service_code: service.id || '',
      service_name: service.name,
      service_category: service.category || '',
      room_number: roomNumber,
      note,
      status: 'requested',
      requested_at: new Date(),
    });

    return mapServiceRequest(request);
  },

  async cancelCustomerServiceRequest(requestId, user) {
    if (!ObjectId.isValid(requestId)) {
      throw createHttpError('Không tìm thấy yêu cầu dịch vụ.', 404);
    }

    const request = await CustomerServiceRequest.findOne({
      _id: new ObjectId(requestId),
      customer_id: user._id,
    });

    if (!request) throw createHttpError('Không tìm thấy yêu cầu dịch vụ.', 404);
    if (request.status !== 'requested') {
      throw createHttpError('Chỉ có thể hủy yêu cầu dịch vụ đang chờ xử lý.');
    }

    request.status = 'canceled';
    request.canceled_at = new Date();
    await request.save();

    return mapServiceRequest(request);
  },
};

module.exports = serviceModule;
