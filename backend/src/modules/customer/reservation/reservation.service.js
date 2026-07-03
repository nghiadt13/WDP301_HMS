const mongoose = require('mongoose');
const asyncHandler = require('../../../utils/async-handler');
const { createHttpError } = require('../../../utils/error.utils');
const { parseDateOnly, parsePositiveInteger } = require('../../../utils/date.utils');

const { ObjectId } = mongoose.Types;

const ADULTS_PER_ROOM = 2;
const CHILDREN_PER_ROOM = 1;
const CANCELED_STATUS = 'Canceled';
const CANCELABLE_STATUS_PATTERN = /pending|confirmed/i;
const ACTIVE_PHYSICAL_ROOM_QUERY = {
  isActive: { $ne: false },
  status: { $nin: ['Maintenance', 'OutOfService'] }
};

const differenceInNights = (start, end) => {
  const checkIn = new Date(start);
  const checkOut = new Date(end);
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / dayMs));
};

const getBookedRooms = async (db, roomTypeId, checkInDate, checkOutDate) => {
  const reservations = await db
    .collection('reservations')
    .find({
      room_type_id: roomTypeId,
      booking_status: { $not: /cancel/i },
      check_in_date: { $lt: checkOutDate },
      check_out_date: { $gt: checkInDate }
    })
    .project({ room_quantity: 1, room_count: 1, rooms_count: 1 })
    .toArray();

  return reservations.reduce(
    (total, reservation) => total + Math.max(1, Number(reservation.room_quantity || reservation.room_count || reservation.rooms_count || 1)),
    0
  );
};

const getTotalRoomsByType = (db, roomTypeId) =>
  db.collection('rooms').countDocuments({
    room_type_id: roomTypeId,
    ...ACTIVE_PHYSICAL_ROOM_QUERY
  });

const buildOccupancy = (payload) => {
  const checkIn = parseDateOnly(payload.checkIn);
  const checkOut = parseDateOnly(payload.checkOut);
  const adults = parsePositiveInteger(payload.adults, 1);
  const children = parsePositiveInteger(payload.children, 0);

  if (!checkIn || !checkOut) {
    throw createHttpError('Please choose valid check-in and check-out dates.');
  }

  if (checkOut <= checkIn) {
    throw createHttpError('Check-out date must be after check-in date.');
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (checkIn < today) {
    throw createHttpError('Cannot book a room in the past.');
  }

  if (adults < 1) {
    throw createHttpError('At least 1 adult is required to book a room.');
  }

  const adultRoomCount = Math.ceil(adults / ADULTS_PER_ROOM);
  const childRoomCount = children > 0 ? Math.ceil(children / CHILDREN_PER_ROOM) : 0;
  const requiredRooms = Math.max(adultRoomCount, childRoomCount, 1);

  if (requiredRooms > adults) {
    throw createHttpError('Children cannot occupy a room without an adult. Please increase adults or reduce children.');
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

const getImages = (roomType, room = null) => {
  if (Array.isArray(roomType?.images) && roomType.images.length > 0) {
    return roomType.images;
  }

  if (roomType?.image_url) {
    return [roomType.image_url];
  }

  if (Array.isArray(room?.images) && room.images.length > 0) {
    return room.images;
  }

  return room?.image_url ? [room.image_url] : [];
};

const mapReservation = (reservation, roomType = null, room = null) => {
  const images = getImages(roomType, room);

  return {
    id: String(reservation._id),
    bookingCode: reservation.booking_code,
    roomId: reservation.room_id ? String(reservation.room_id) : '',
    roomTypeId: reservation.room_type_id ? String(reservation.room_type_id) : '',
    roomName: roomType?.name || room?.roomName || '',
    roomNumber: room?.room_number || room?.roomName || '',
    roomImage: images[0] || '',
    roomImages: images,
    roomPrice: Number(roomType?.base_price || roomType?.price || room?.price || 0),
    checkInDate: reservation.check_in_date,
    checkOutDate: reservation.check_out_date,
    guestCount: reservation.guest_count || 0,
    adultCount: reservation.adult_count || 0,
    childCount: reservation.child_count || 0,
    roomQuantity: Math.max(1, Number(reservation.room_quantity || reservation.room_count || reservation.rooms_count || 1)),
    specialRequest: reservation.special_request || '',
    totalAmount: reservation.total_amount || 0,
    depositAmount: reservation.deposit_amount || 0,
    paymentStatus: reservation.payment_status || '',
    bookingStatus: reservation.booking_status || '',
    createdAt: reservation.created_at || reservation.createdAt || null
  };
};

const mapRoomSummary = (roomType = null, room = null) => {
  if (!roomType && !room) return null;

  const features = Array.isArray(roomType?.features) ? roomType.features : [];
  const images = getImages(roomType, room);

  return {
    id: String(roomType?._id || room?._id),
    name: roomType?.name || room?.roomName || 'Room',
    roomNumber: room?.room_number || room?.roomName || '',
    description: roomType?.description || room?.description || '',
    image: images[0] || '',
    images,
    area: roomType?.area || features[0] || '',
    guests: roomType?.guests || features[1] || (roomType?.capacity ? `${roomType.capacity} Guests` : ''),
    beds: roomType?.beds || features[2] || roomType?.bed_type || room?.bed_type || '',
    facilities: Array.isArray(roomType?.facilities) ? roomType.facilities : [],
    price: Number(roomType?.base_price || roomType?.price || room?.price || 0)
  };
};

const createRoomBooking = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;

  if (!ObjectId.isValid(req.params.roomId)) {
    throw createHttpError('Room type not found.', 404);
  }

  const roomType = await db.collection('room_types').findOne({
    _id: new ObjectId(req.params.roomId),
    is_active: { $ne: false }
  });

  if (!roomType) {
    throw createHttpError('Room type not found.', 404);
  }

  const occupancy = buildOccupancy(req.body);
  const [bookedRooms, totalRooms] = await Promise.all([
    getBookedRooms(db, roomType._id, occupancy.checkIn, occupancy.checkOut),
    getTotalRoomsByType(db, roomType._id)
  ]);
  const availableRooms = Math.max(0, totalRooms - bookedRooms);

  if (availableRooms < occupancy.requiredRooms) {
    throw createHttpError(`Only ${availableRooms} room(s) are available for this room type in the selected date range.`, 409);
  }

  const now = new Date();
  const pricePerNight = Number(roomType.base_price || roomType.price || 0);
  const totalAmount = pricePerNight * occupancy.nights * occupancy.requiredRooms;
  const reservation = {
    _id: new ObjectId(),
    booking_code: generateBookingCode(req.user),
    customer_id: req.user._id,
    room_type_id: roomType._id,
    room_id: null,
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
    message: 'Booking created successfully. Please wait for hotel confirmation.',
    reservation: mapReservation(reservation, roomType)
  });
});

const cancelCustomerReservation = asyncHandler(async (req, res) => {
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

  if (!CANCELABLE_STATUS_PATTERN.test(String(reservation.booking_status || ''))) {
    throw createHttpError('Only pending or confirmed reservations can be canceled.', 400);
  }

  if (reservation.check_in_date && new Date(reservation.check_in_date) <= new Date()) {
    throw createHttpError('Cannot cancel a reservation on or after the check-in date.', 400);
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
  const roomType = updatedReservation.room_type_id
    ? await db.collection('room_types').findOne({ _id: updatedReservation.room_type_id })
    : null;

  res.send({
    message: 'Reservation canceled.',
    reservation: mapReservation(updatedReservation, roomType)
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

  const [roomType, room] = await Promise.all([
    reservation.room_type_id ? db.collection('room_types').findOne({ _id: reservation.room_type_id }) : null,
    reservation.room_id ? db.collection('rooms').findOne({ _id: reservation.room_id }) : null
  ]);

  res.send({
    reservation: mapReservation(reservation, roomType, room),
    room: mapRoomSummary(roomType, room)
  });
});

module.exports = {
  cancelCustomerReservation,
  createRoomBooking,
  getCustomerReservation
};
