const mongoose = require('mongoose');

const CustomerFeedback = require('../../../models/customerFeedback.model');
const { createHttpError } = require('../../../utils/error.utils');

const { ObjectId } = mongoose.Types;

const CANCELED_STATUS_PATTERN = /cancel|canceled|cancelled|huy|hủy/i;
const CHECKED_OUT_STATUS_PATTERN = /checkedout|checked-out|completed/i;

const getCustomerIdFilter = (user) => ({
  customer_id: { $in: [user._id, String(user._id)] },
});

const getLatestManagerResponse = (feedback) => {
  const responses = Array.isArray(feedback.manager_responses) ? feedback.manager_responses : [];
  return responses[responses.length - 1] || null;
};

const isCheckedOutReservation = (reservation = {}) =>
  CHECKED_OUT_STATUS_PATTERN.test(String(reservation.booking_status || reservation.status || ''));

const mapCustomerFeedback = (feedback) => ({
  id: String(feedback._id),
  reservationId: feedback.reservation_id ? String(feedback.reservation_id) : '',
  customerName: feedback.customer_name,
  customerEmail: feedback.customer_email,
  roomNumber: feedback.room_number || '',
  rating: Number(feedback.rating || 0),
  feedbackText: feedback.feedback_text,
  responseText: feedback.response_text || getLatestManagerResponse(feedback)?.responseText || '',
  status: String(feedback.status || 'submitted').toLowerCase(),
  submittedAt: feedback.submitted_at,
  respondedAt: feedback.responded_at || getLatestManagerResponse(feedback)?.respondedAt || null,
});

const getReservationRoomName = (reservation, room = null, roomType = null) =>
  room?.roomName
  || reservation.room_number
  || reservation.assigned_room
  || roomType?.name
  || 'Phòng đã đặt';

const mapFeedbackRoom = (reservation, room, roomType = null) => ({
  reservationId: String(reservation._id),
  bookingCode: reservation.booking_code || '',
  roomId: reservation.room_id ? String(reservation.room_id) : '',
  roomNumber: getReservationRoomName(reservation, room, roomType),
  roomName: getReservationRoomName(reservation, room, roomType),
  roomImage: Array.isArray(roomType?.images)
    ? roomType.images[0] || ''
    : Array.isArray(room?.images)
      ? room.images[0] || ''
      : room?.image_url || '',
  bookingStatus: reservation.booking_status || '',
  checkInDate: reservation.check_in_date || null,
  checkOutDate: reservation.check_out_date || null,
});

const getReservationForFeedback = async (reservationId, user) => {
  if (!ObjectId.isValid(reservationId)) {
    throw createHttpError('Vui lòng chọn phòng/booking hợp lệ.', 400);
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
    throw createHttpError('Không thể góp ý cho booking đã hủy.', 400);
  }

  if (!isCheckedOutReservation(reservation)) {
    throw createHttpError('Bạn chỉ có thể đánh giá sau khi booking đã check-out.', 400);
  }

  const room = reservation.room_id
    ? await db.collection('rooms').findOne({ _id: reservation.room_id })
    : null;
  const roomType = reservation.room_type_id
    ? await db.collection('room_types').findOne({ _id: reservation.room_type_id })
    : null;

  return { reservation, room, roomType };
};

const normalizeFeedbackPayload = async (body, user) => {
  const customerName = String(user?.full_name || body.customerName || body.customer_name || '').trim();
  const customerEmail = String(user?.email || body.customerEmail || body.customer_email || '').trim();
  const reservationId = String(body.reservationId || body.reservation_id || '').trim();
  const feedbackText = String(body.feedbackText || body.feedback_text || '').trim();
  const rating = Number.parseInt(body.rating, 10);

  if (customerName.length < 2) {
    throw createHttpError('Tên khách hàng phải có ít nhất 2 ký tự.');
  }

  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw createHttpError('Email khách hàng không hợp lệ.');
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw createHttpError('Đánh giá phải từ 1 đến 5 sao.');
  }

  if (feedbackText.length < 3) {
    throw createHttpError('Nội dung góp ý phải có ít nhất 3 ký tự.');
  }

  if (feedbackText.length > 1000) {
    throw createHttpError('Nội dung góp ý không được vượt quá 1000 ký tự.');
  }

  const { reservation, room, roomType } = await getReservationForFeedback(reservationId, user);
  const roomNumber = getReservationRoomName(reservation, room, roomType);

  return {
    reservation_id: reservation._id,
    customer_id: user?._id || null,
    customer_name: customerName,
    customer_email: customerEmail,
    room_number: roomNumber,
    rating,
    feedback_text: feedbackText,
    status: 'submitted',
    submitted_at: new Date(),
  };
};

const customerFeedbackService = {
  async listFeedbackRooms(user) {
    const db = mongoose.connection.db;
    const reservations = await db
      .collection('reservations')
      .find({
        customer_id: { $in: [user._id, String(user._id)] },
        booking_status: CHECKED_OUT_STATUS_PATTERN,
        status: { $not: CANCELED_STATUS_PATTERN },
      })
      .sort({ check_out_date: -1, check_in_date: -1, created_at: -1 })
      .toArray();

    const rooms = await Promise.all(
      reservations.map(async (reservation) => {
        const room = reservation.room_id
          ? await db.collection('rooms').findOne({ _id: reservation.room_id })
          : null;
        let roomType = reservation.room_type_id
          ? await db.collection('room_types').findOne({ _id: reservation.room_type_id })
          : null;
        if (!roomType && room && room.room_type_id) {
          roomType = await db.collection('room_types').findOne({ _id: room.room_type_id });
        }
        return mapFeedbackRoom(reservation, room, roomType);
      })
    );

    return rooms;
  },

  async getFeedbackStatus(user) {
    const [rooms, existingFeedback] = await Promise.all([
      this.listFeedbackRooms(user),
      CustomerFeedback.findOne(getCustomerIdFilter(user)).lean(),
    ]);

    return {
      pendingCount: existingFeedback ? 0 : rooms.length,
      canReview: rooms.length > 0 && !existingFeedback,
      hasFeedback: Boolean(existingFeedback),
    };
  },

  async listCustomerFeedbacks(user) {
    const feedback = await CustomerFeedback.findOne(getCustomerIdFilter(user)).sort({ submitted_at: -1 }).lean();
    return feedback ? [mapCustomerFeedback(feedback)] : [];
  },

  async sendCustomerFeedback(body, user) {
    const existingFeedback = await CustomerFeedback.findOne(getCustomerIdFilter(user)).lean();
    if (existingFeedback) {
      throw createHttpError('Bạn đã gửi góp ý rồi. Mỗi tài khoản chỉ được gửi một góp ý.', 409);
    }

    const feedback = await CustomerFeedback.create(await normalizeFeedbackPayload(body, user));
    return mapCustomerFeedback(feedback);
  },
};

module.exports = customerFeedbackService;
