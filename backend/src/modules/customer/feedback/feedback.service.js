const mongoose = require('mongoose');

const CustomerFeedback = require('../../../models/customerFeedback.model');
const { createHttpError } = require('../../../utils/error.utils');

const { ObjectId } = mongoose.Types;

const CANCELED_STATUS_PATTERN = /cancel|huy|hủy/i;
const REVIEWABLE_STATUS_PATTERN =
  /checked[\s-]?out|completed|finished|hoan[\s-]?tat|hoàn[\s-]?tất|da[\s-]?tra[\s-]?phong|đã[\s-]?trả[\s-]?phòng/i;

const isReviewableReservation = (reservation = {}) =>
  REVIEWABLE_STATUS_PATTERN.test(String(reservation.booking_status || reservation.status || ''));

const mapFeedbackHistoryItem = (historyItem) => ({
  roomNumber: historyItem.room_number || '',
  rating: Number(historyItem.rating || 0),
  feedbackText: historyItem.feedback_text || '',
  responseText: historyItem.response_text || '',
  status: String(historyItem.status || 'submitted').toLowerCase(),
  submittedAt: historyItem.submitted_at || null,
  respondedAt: historyItem.responded_at || null,
  savedAt: historyItem.saved_at || null,
});

const mapCustomerFeedback = (feedback) => ({
  id: String(feedback._id),
  reservationId: feedback.reservation_id ? String(feedback.reservation_id) : '',
  customerName: feedback.customer_name,
  customerEmail: feedback.customer_email,
  roomNumber: feedback.room_number || '',
  rating: Number(feedback.rating || 0),
  feedbackText: feedback.feedback_text,
  responseText: feedback.response_text || '',
  status: String(feedback.status || 'submitted').toLowerCase(),
  submittedAt: feedback.submitted_at,
  respondedAt: feedback.responded_at || null,
  history: Array.isArray(feedback.feedback_history) ? feedback.feedback_history.map(mapFeedbackHistoryItem) : [],
});

const mapFeedbackRoom = (reservation, room) => ({
  reservationId: String(reservation._id),
  bookingCode: reservation.booking_code || '',
  roomId: reservation.room_id ? String(reservation.room_id) : '',
  roomNumber: room?.roomName || reservation.room_number || reservation.assigned_room || '',
  roomName: room?.roomName || reservation.room_number || reservation.assigned_room || 'Phòng đã đặt',
  roomImage: Array.isArray(room?.images) ? room.images[0] || '' : room?.image_url || '',
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
    customer_id: user._id,
  });

  if (!reservation) {
    throw createHttpError('Không tìm thấy booking thuộc tài khoản của bạn.', 404);
  }

  if (CANCELED_STATUS_PATTERN.test(String(reservation.booking_status || ''))) {
    throw createHttpError('Không thể góp ý cho booking đã hủy.', 400);
  }

  if (!isReviewableReservation(reservation)) {
    throw createHttpError('Chỉ có thể góp ý sau khi booking đã hoàn tất/check-out.', 400);
  }

  const room = reservation.room_id
    ? await db.collection('rooms').findOne({ _id: reservation.room_id })
    : null;

  return { reservation, room };
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

  const { reservation, room } = await getReservationForFeedback(reservationId, user);
  const roomNumber = room?.roomName || reservation.room_number || reservation.assigned_room || '';

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
        customer_id: user._id,
        booking_status: { $not: CANCELED_STATUS_PATTERN },
      })
      .sort({ check_out_date: -1, check_in_date: -1, created_at: -1 })
      .toArray();

    const reviewableReservations = reservations.filter(isReviewableReservation);

    const rooms = await Promise.all(
      reviewableReservations.map(async (reservation) => {
        const room = reservation.room_id
          ? await db.collection('rooms').findOne({ _id: reservation.room_id })
          : null;
        return mapFeedbackRoom(reservation, room);
      })
    );

    return rooms;
  },

  async listCustomerFeedbacks(user) {
    const feedback = await CustomerFeedback.findOne({ customer_id: user._id }).sort({ submitted_at: -1 }).lean();
    return feedback ? [mapCustomerFeedback(feedback)] : [];
  },

  async sendCustomerFeedback(body, user) {
    const existingFeedback = await CustomerFeedback.findOne({ customer_id: user._id }).lean();
    if (existingFeedback) {
      throw createHttpError('Bạn đã gửi góp ý rồi. Vui lòng cập nhật góp ý hiện có nếu muốn bổ sung.', 409);
    }

    const feedback = await CustomerFeedback.create(await normalizeFeedbackPayload(body, user));
    return mapCustomerFeedback(feedback);
  },

  async updateCustomerFeedback(feedbackId, body, user) {
    if (!ObjectId.isValid(feedbackId)) {
      throw createHttpError('Không tìm thấy góp ý.', 404);
    }

    const feedback = await CustomerFeedback.findOne({
      _id: new ObjectId(feedbackId),
      customer_id: user._id,
    });

    if (!feedback) throw createHttpError('Không tìm thấy góp ý.', 404);

    const feedbackPayload = await normalizeFeedbackPayload(body, user);

    if (!Array.isArray(feedback.feedback_history)) {
      feedback.feedback_history = [];
    }

    feedback.feedback_history.unshift({
      room_number: feedback.room_number || '',
      rating: feedback.rating,
      feedback_text: feedback.feedback_text,
      response_text: feedback.response_text || '',
      status: feedback.status,
      submitted_at: feedback.submitted_at || null,
      responded_at: feedback.responded_at || null,
      saved_at: new Date(),
    });

    feedback.reservation_id = feedbackPayload.reservation_id;
    feedback.room_number = feedbackPayload.room_number;
    feedback.rating = feedbackPayload.rating;
    feedback.feedback_text = feedbackPayload.feedback_text;
    feedback.status = 'submitted';
    feedback.submitted_at = new Date();
    feedback.response_text = '';
    feedback.responded_at = null;
    feedback.archived_at = null;

    await feedback.save();
    return mapCustomerFeedback(feedback);
  },
};

module.exports = customerFeedbackService;
