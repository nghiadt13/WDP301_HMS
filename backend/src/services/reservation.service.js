const mongoose = require('mongoose');

const asyncHandler = require('../utils/async-handler');

const { ObjectId } = mongoose.Types;

const ADULTS_PER_ROOM = 2;
const CHILDREN_PER_ROOM = 1;
const CANCELED_STATUS = 'Canceled';
const CANCELABLE_STATUS_PATTERN = /pending|confirmed/i;

const createHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parsePositiveInteger = (value, fallback = 0) => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : fallback;
};

const parseDateOnly = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const differenceInNights = (start, end) => {
  const checkIn = new Date(start);
  const checkOut = new Date(end);
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / dayMs));
};

const getRoomQuantity = (reservation) =>
  Math.max(1, Number(reservation.room_quantity || reservation.room_count || reservation.rooms_count || 1));

const getBookedRooms = async (db, roomId, checkInDate, checkOutDate) => {
  const reservations = await db
    .collection('reservations')
    .find({
      room_id: roomId,
      booking_status: { $not: /cancel/i },
      check_in_date: { $lt: checkOutDate },
      check_out_date: { $gt: checkInDate }
    })
    .project({ room_quantity: 1, room_count: 1, rooms_count: 1 })
    .toArray();

  return reservations.reduce((total, reservation) => total + getRoomQuantity(reservation), 0);
};

const buildOccupancy = (payload) => {
  const checkIn = parseDateOnly(payload.checkIn);
  const checkOut = parseDateOnly(payload.checkOut);
  const adults = parsePositiveInteger(payload.adults, 1);
  const children = parsePositiveInteger(payload.children, 0);

  if (!checkIn || !checkOut) {
    throw createHttpError('Vui lòng chọn ngày đến và ngày đi hợp lệ.');
  }

  if (checkOut <= checkIn) {
    throw createHttpError('Ngày đi phải sau ngày đến.');
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (checkIn < today) {
    throw createHttpError('Không thể đặt phòng cho ngày trong quá khứ.');
  }

  if (adults < 1) {
    throw createHttpError('Cần ít nhất 1 người lớn để đặt phòng.');
  }

  const adultRoomCount = Math.ceil(adults / ADULTS_PER_ROOM);
  const childRoomCount = children > 0 ? Math.ceil(children / CHILDREN_PER_ROOM) : 0;
  const requiredRooms = Math.max(adultRoomCount, childRoomCount, 1);

  if (requiredRooms > adults) {
    throw createHttpError('Trẻ em không thể tự đứng phòng. Vui lòng tăng số người lớn hoặc giảm số trẻ em.');
  }

  return {
    checkIn,
    checkOut,
    adults,
    children,
    guestCount: adults + children,
    requiredRooms,
    nights: differenceInNights(checkIn, checkOut)
  };
};

const generateBookingCode = (user) => {
  const account = String(user.login_account || user.email || user._id)
    .split('@')[0]
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 16);
  const suffix = Date.now().toString(36).toUpperCase().slice(-6);
  return `BKG-${account || 'GUEST'}-${suffix}`;
};

const mapReservation = (reservation, room = null) => ({
  id: String(reservation._id),
  bookingCode: reservation.booking_code,
  roomId: reservation.room_id ? String(reservation.room_id) : '',
  roomName: room?.roomName || '',
  roomImage: Array.isArray(room?.images) ? room.images[0] || '' : room?.image_url || '',
  roomImages: Array.isArray(room?.images) ? room.images : room?.image_url ? [room.image_url] : [],
  roomPrice: Number(room?.price || room?.base_price || 0),
  checkInDate: reservation.check_in_date,
  checkOutDate: reservation.check_out_date,
  guestCount: reservation.guest_count || 0,
  adultCount: reservation.adult_count || 0,
  childCount: reservation.child_count || 0,
  roomQuantity: getRoomQuantity(reservation),
  specialRequest: reservation.special_request || '',
  totalAmount: reservation.total_amount || 0,
  depositAmount: reservation.deposit_amount || 0,
  paymentStatus: reservation.payment_status || '',
  bookingStatus: reservation.booking_status || '',
  createdAt: reservation.created_at || reservation.createdAt || null
});

const mapRoomSummary = (room = null) => {
  if (!room) {
    return null;
  }

  const features = Array.isArray(room.features) ? room.features : [];
  const images = Array.isArray(room.images) ? room.images : room.image_url ? [room.image_url] : [];

  return {
    id: String(room._id),
    name: room.roomName || 'Room',
    description: room.description || '',
    image: images[0] || '',
    images,
    area: features[0] || '',
    guests: features[1] || '',
    beds: features[2] || '',
    facilities: Array.isArray(room.facilities) ? room.facilities : [],
    price: Number(room.price || room.base_price || 0),
    totalRooms: Number(room.totalRooms || 0)
  };
};

const createRoomBooking = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;

  if (!ObjectId.isValid(req.params.roomId)) {
    throw createHttpError('Không tìm thấy phòng.', 404);
  }

  const room = await db.collection('rooms').findOne({
    _id: new ObjectId(req.params.roomId),
    isActive: { $ne: false }
  });

  if (!room) {
    throw createHttpError('Không tìm thấy phòng.', 404);
  }

  const occupancy = buildOccupancy(req.body);
  const bookedRooms = await getBookedRooms(db, room._id, occupancy.checkIn, occupancy.checkOut);
  const totalRooms = Number(room.totalRooms || 0);
  const availableRooms = Math.max(0, totalRooms - bookedRooms);

  if (availableRooms < occupancy.requiredRooms) {
    throw createHttpError(`Phòng này chỉ còn ${availableRooms} phòng trong khoảng ngày đã chọn.`, 409);
  }

  const now = new Date();
  const pricePerNight = Number(room.price || room.base_price || 0);
  const totalAmount = pricePerNight * occupancy.nights * occupancy.requiredRooms;
  const reservation = {
    _id: new ObjectId(),
    booking_code: generateBookingCode(req.user),
    customer_id: req.user._id,
    room_type_id: room.room_type_id || null,
    room_id: room._id,
    check_in_date: occupancy.checkIn,
    check_out_date: occupancy.checkOut,
    guest_count: occupancy.guestCount,
    adult_count: occupancy.adults,
    child_count: occupancy.children,
    room_quantity: occupancy.requiredRooms,
    special_request: String(req.body.specialRequest || '').trim(),
    total_amount: totalAmount,
    deposit_amount: 0,
    payment_status: 'Unpaid',
    booking_status: 'Pending',
    created_at: now,
    updated_at: now
  };

  await db.collection('reservations').insertOne(reservation);

  res.status(201).send({
    message: 'Đặt phòng thành công. Vui lòng chờ khách sạn xác nhận.',
    reservation: mapReservation(reservation, room)
  });
});

const cancelCustomerReservation = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;

  if (!ObjectId.isValid(req.params.reservationId)) {
    throw createHttpError('Không tìm thấy đặt phòng.', 404);
  }

  const reservation = await db.collection('reservations').findOne({
    _id: new ObjectId(req.params.reservationId),
    customer_id: req.user._id
  });

  if (!reservation) {
    throw createHttpError('Không tìm thấy đặt phòng của bạn.', 404);
  }

  if (!CANCELABLE_STATUS_PATTERN.test(String(reservation.booking_status || ''))) {
    throw createHttpError('Chỉ có thể hủy đặt phòng đang chờ xác nhận hoặc đã xác nhận.', 400);
  }

  if (reservation.check_in_date && new Date(reservation.check_in_date) <= new Date()) {
    throw createHttpError('Không thể hủy đặt phòng đã đến ngày check-in.', 400);
  }

  const now = new Date();
  await db.collection('reservations').updateOne(
    { _id: reservation._id },
    {
      $set: {
        booking_status: CANCELED_STATUS,
        canceled_at: now,
        updated_at: now
      }
    }
  );

  const updatedReservation = await db.collection('reservations').findOne({ _id: reservation._id });

  res.send({
    message: 'Đã hủy đặt phòng.',
    reservation: mapReservation(updatedReservation)
  });
});

const getCustomerReservation = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;

  if (!ObjectId.isValid(req.params.reservationId)) {
    throw createHttpError('Reservation not found.', 404);
  }

  const reservation = await db.collection('reservations').findOne({
    _id: new ObjectId(req.params.reservationId),
    customer_id: req.user._id
  });

  if (!reservation) {
    throw createHttpError('Reservation not found for this account.', 404);
  }

  const room = reservation.room_id
    ? await db.collection('rooms').findOne({ _id: reservation.room_id })
    : null;

  res.send({
    reservation: mapReservation(reservation, room),
    room: mapRoomSummary(room)
  });
});

module.exports = {
  cancelCustomerReservation,
  createRoomBooking,
  getCustomerReservation
};
