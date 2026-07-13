const mongoose = require('mongoose');

const CustomerServiceRequest = require('../../../models/customerServiceRequest.model');
const HotelService = require('../../../models/hotelService.model');
const { createHttpError } = require('../../../utils/error.utils');

const { ObjectId } = mongoose.Types;

const CANCELED_STATUS_PATTERN = /cancel|canceled|cancelled|huy|hủy/i;

const isPaidReservation = (reservation = {}) => {
  const paymentStatus = String(reservation.payment_status || reservation.paymentStatus || '').trim().toLowerCase();
  const totalAmount = Number(reservation.total_amount || reservation.totalAmount || 0);
  const paidAmount = Number(reservation.deposit_amount || reservation.depositAmount || reservation.paid_amount || 0);

  return paymentStatus === 'paid' || (totalAmount > 0 && paidAmount >= totalAmount);
};

const serviceImagesByKey = {
  dining: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80',
  housekeeping: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
  laundry: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=900&q=80',
  maintenance: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80',
  amenities: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=900&q=80',
  transport: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=80',
  spa: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
};

const resolveServiceImage = (service) => {
  const rawKey = String(service.image_key || service.category || service.name || '').toLowerCase();
  if (rawKey.includes('technical') || rawKey.includes('maintenance') || rawKey.includes('repair')) return serviceImagesByKey.maintenance;
  if (service.image_url) return service.image_url;

  if (rawKey.includes('dining') || rawKey.includes('room service')) return serviceImagesByKey.dining;
  if (rawKey.includes('housekeeping')) return serviceImagesByKey.housekeeping;
  if (rawKey.includes('laundry')) return serviceImagesByKey.laundry;
  if (rawKey.includes('technical') || rawKey.includes('maintenance')) return serviceImagesByKey.maintenance;
  if (rawKey.includes('transport') || rawKey.includes('airport')) return serviceImagesByKey.transport;
  if (rawKey.includes('spa') || rawKey.includes('wellness') || rawKey.includes('massage')) return serviceImagesByKey.spa;
  return serviceImagesByKey.amenities;
};

const isDuplicateFootSoakService = (service) => {
  const name = String(service.name || '').toLowerCase();
  return name.includes('ng\u00e2m ch\u00e2n') || name.includes('foot soak');
};
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
    description: 'Đặt lịch mát xa thư giãn, chăm sóc cơ thể và ngâm chân thảo mộc trong cùng một dịch vụ spa.',
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
  imageUrl: resolveServiceImage(service),
  imageKey: service.image_key || '',
  isActive: service.is_active !== false,
});

const mapServiceRequest = (request) => ({
  id: String(request._id),
  serviceId: request.hotel_service_id ? String(request.hotel_service_id) : request.service_code || '',
  reservationId: request.reservation_id ? String(request.reservation_id) : '',
  serviceName: request.service_name,
  serviceCategory: request.service_category || '',
  roomNumber: request.room_number,
  note: request.note || '',
  status: request.status,
  requestedAt: request.requested_at,
  canceledAt: request.canceled_at,
  handledAt: request.handled_at,
});

const getReservationRoomName = (reservation, room = null, roomType = null) =>
  room?.roomName
  || reservation.room_number
  || reservation.assigned_room
  || roomType?.name
  || 'Phòng đã đặt';

const mapServiceRoom = (reservation, room, roomType = null) => ({
  id: String(reservation._id),
  reservationId: String(reservation._id),
  roomId: reservation.room_id ? String(reservation.room_id) : '',
  name: getReservationRoomName(reservation, room, roomType),
  rawName: getReservationRoomName(reservation, room, roomType),
  bookingCode: reservation.booking_code || '',
  bookingStatus: reservation.booking_status || '',
  checkInDate: reservation.check_in_date || null,
  checkOutDate: reservation.check_out_date || null,
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

const getCustomerServiceReservation = async (reservationId, user) => {
  if (!ObjectId.isValid(reservationId)) {
    throw createHttpError('Vui lòng chọn booking/phòng hợp lệ.');
  }

  const db = mongoose.connection.db;
  const reservation = await db.collection('reservations').findOne({
    _id: new ObjectId(reservationId),
    customer_id: { $in: [user._id, String(user._id)] },
  });

  if (!reservation) {
    throw createHttpError('Không tìm thấy booking thuộc tài khoản của bạn.', 404);
  }

  if (CANCELED_STATUS_PATTERN.test(String(reservation.booking_status || reservation.status || ''))) {
    throw createHttpError('Không thể gửi yêu cầu dịch vụ cho booking đã hủy.');
  }

  if (!isPaidReservation(reservation)) {
    throw createHttpError('Bạn cần thanh toán booking trước khi gửi yêu cầu dịch vụ.');
  }

  const room = reservation.room_id
    ? await db.collection('rooms').findOne({ _id: reservation.room_id })
    : null;
  const roomType = reservation.room_type_id
    ? await db.collection('room_types').findOne({ _id: reservation.room_type_id })
    : null;

  return { reservation, room, roomType };
};

const serviceModule = {
  async listHotelServices() {
    const services = await HotelService.find({ is_active: { $ne: false } }).sort({ category: 1, name: 1 }).lean();
    return (services.length > 0 ? services : serviceFallbacks).filter((service) => !isDuplicateFootSoakService(service)).map(mapHotelService);
  },

  async getHotelServiceDetail(serviceId) {
    const service = await findServiceById(serviceId);
    if (!service) throw createHttpError('Không tìm thấy dịch vụ khách sạn.', 404);
    return mapHotelService(service);
  },

  async listCustomerServiceRequests(user) {
    const requests = await CustomerServiceRequest.find({
      customer_id: user._id,
      status: { $ne: 'canceled' },
    }).sort({ requested_at: -1 }).lean();
    return requests.map(mapServiceRequest);
  },

  async listCustomerServiceRooms(user) {
    const db = mongoose.connection.db;
    const reservations = await db
      .collection('reservations')
      .find({
        customer_id: { $in: [user._id, String(user._id)] },
        booking_status: { $not: CANCELED_STATUS_PATTERN },
        status: { $not: CANCELED_STATUS_PATTERN },
      })
      .sort({ check_in_date: -1, created_at: -1 })
      .toArray();

    const paidReservations = reservations.filter(isPaidReservation);

    return Promise.all(
      paidReservations.map(async (reservation) => {
        const room = reservation.room_id
          ? await db.collection('rooms').findOne({ _id: reservation.room_id })
          : null;
        const roomType = reservation.room_type_id
          ? await db.collection('room_types').findOne({ _id: reservation.room_type_id })
          : null;
        return mapServiceRoom(reservation, room, roomType);
      })
    );
  },

  async requestHotelService(serviceId, body, user) {
    const service = await findServiceById(serviceId);
    if (!service) throw createHttpError('Không tìm thấy dịch vụ khách sạn.', 404);

    const reservationId = String(body.reservationId || body.reservation_id || '').trim();
    const note = String(body.note || '').trim();
    const { reservation, room, roomType } = await getCustomerServiceReservation(reservationId, user);
    const roomNumber = getReservationRoomName(reservation, room, roomType);

    if (roomNumber.length < 1 || roomNumber.length > 80) {
      throw createHttpError('Vui lòng chọn phòng hợp lệ.');
    }

    if (note.length > 500) {
      throw createHttpError('Ghi chú yêu cầu dịch vụ không được vượt quá 500 ký tự.');
    }

    const request = await CustomerServiceRequest.create({
      customer_id: user._id,
      hotel_service_id: service._id || null,
      reservation_id: reservation._id,
      service_code: service.id || '',
      service_name: service.name,
      service_category: service.category || '',
      room_number: roomNumber,
      note,
      status: 'requested',
      assigned_role: 'receptionist',
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
