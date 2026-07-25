const mongoose = require('mongoose');
const asyncHandler = require('../../../utils/async-handler');
const { createHttpError } = require('../../../utils/error.utils');
const { parseHotelCheckInDate, parseHotelCheckOutDate, parsePositiveInteger } = require('../../../utils/date.utils');
const {
  buildActiveReservationQuery,
  expirePendingReservations,
  getPaymentExpiresAt,
  PAYMENT_HOLD_MINUTES
} = require('../../../utils/reservation-status.utils');
const { sendReservationCancellationEmail } = require('../../../utils/mail.utils');

const { ObjectId } = mongoose.Types;

const ADULTS_PER_ROOM = 2;
const CHILDREN_PER_ROOM = 1;
const CANCELED_STATUS = 'Canceled';
const CANCELABLE_STATUS_PATTERN = /pending|confirmed/i;
const REFUND_ALLOWED_WINDOW_MS = 48 * 60 * 60 * 1000;
const SUPPORT_PHONE = '0868729129';
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
  await expirePendingReservations(db);

  const reservations = await db
    .collection('reservations')
    .find(buildActiveReservationQuery({
      roomTypeId,
      checkInDate,
      checkOutDate
    }))
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

const getOverlappingAssignedRoomIds = async (db, roomTypeId, checkInDate, checkOutDate) => {
  await expirePendingReservations(db);

  const reservations = await db
    .collection('reservations')
    .find(buildActiveReservationQuery({
      roomTypeId,
      checkInDate,
      checkOutDate
    }))
    .project({ _id: 1, room_id: 1, assigned_room_ids: 1 })
    .toArray();

  const assignedRoomIds = new Set();

  reservations.forEach((reservation) => {
    if (reservation.room_id) {
      assignedRoomIds.add(String(reservation.room_id));
    }

    if (Array.isArray(reservation.assigned_room_ids)) {
      reservation.assigned_room_ids.forEach((roomId) => {
        if (roomId) assignedRoomIds.add(String(roomId));
      });
    }
  });

  const reservationIds = reservations.map((reservation) => reservation._id);

  if (reservationIds.length > 0) {
    const bookingRooms = await db
      .collection('booking_rooms')
      .find({
        booking_id: { $in: reservationIds },
        room_id: { $ne: null }
      })
      .project({ room_id: 1 })
      .toArray();

    bookingRooms.forEach((bookingRoom) => {
      if (bookingRoom.room_id) assignedRoomIds.add(String(bookingRoom.room_id));
    });
  }

  return assignedRoomIds;
};

const getAvailablePhysicalRooms = async (db, roomTypeId, checkInDate, checkOutDate, requiredRooms) => {
  const assignedRoomIds = await getOverlappingAssignedRoomIds(db, roomTypeId, checkInDate, checkOutDate);
  const excludedIds = Array.from(assignedRoomIds)
    .filter((roomId) => ObjectId.isValid(roomId))
    .map((roomId) => new ObjectId(roomId));
  const query = {
    room_type_id: roomTypeId,
    ...ACTIVE_PHYSICAL_ROOM_QUERY
  };

  if (excludedIds.length > 0) {
    query._id = { $nin: excludedIds };
  }

  return db
    .collection('rooms')
    .find(query)
    .sort({ room_number: 1, roomName: 1, _id: 1 })
    .limit(requiredRooms)
    .toArray();
};
const buildOccupancy = (payload) => {
  const checkIn = parseHotelCheckInDate(payload.checkIn);
  const checkOut = parseHotelCheckOutDate(payload.checkOut);
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
    paymentExpiresAt: reservation.payment_expires_at || null,
    createdAt: reservation.created_at || reservation.createdAt || null
  };
};

const normalizeForMatching = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const formatVnpayDate = (date) => {
  const pad = (value) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('');
};

const getVnpayRefundConfig = () => {
  const tmnCode = process.env.VNPAY_TMN_CODE;
  const hashSecret = process.env.VNPAY_HASH_SECRET;

  if (!tmnCode || !hashSecret) {
    throw createHttpError('VNPAY refund is not configured on the server.', 500);
  }

  return {
    apiUrl: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
    hashSecret,
    tmnCode
  };
};

const getRequestIp = (req) =>
  String(
    req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '127.0.0.1'
  )
    .split(',')[0]
    .trim()
    .replace('::ffff:', '');

const buildRefundHashData = (params) =>
  [
    params.vnp_RequestId,
    params.vnp_Version,
    params.vnp_Command,
    params.vnp_TmnCode,
    params.vnp_TransactionType,
    params.vnp_TxnRef,
    params.vnp_Amount,
    params.vnp_TransactionNo,
    params.vnp_TransactionDate,
    params.vnp_CreateBy,
    params.vnp_CreateDate,
    params.vnp_IpAddr,
    params.vnp_OrderInfo
  ].join('|');

const signRefundParams = (params, hashSecret) =>
  require('crypto').createHmac('sha512', hashSecret).update(buildRefundHashData(params), 'utf8').digest('hex');

const getCompletedPayments = async (db, reservationId) =>
  db
    .collection('payments')
    .find({
      reservation_id: reservationId,
      status: 'Completed'
    })
    .toArray();

const getPaidAmount = (payments) => payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);

const callVnpayRefund = async ({ req, reservation, payment, amount }) => {
  const config = getVnpayRefundConfig();
  const now = new Date();
  const transactionDate =
    payment.vnpay_payload?.vnp_PayDate ||
    payment.vnpay_payload?.vnp_CreateDate ||
    formatVnpayDate(new Date(payment.created_at || payment.paid_at || now));
  const txnRef = payment.transaction_id || normalizeForMatching(reservation.booking_code);
  const params = {
    vnp_RequestId: `${normalizeForMatching(reservation.booking_code).slice(0, 20)}${Date.now().toString(36).toUpperCase()}`,
    vnp_Version: '2.1.0',
    vnp_Command: 'refund',
    vnp_TmnCode: config.tmnCode,
    vnp_TransactionType: '02',
    vnp_TxnRef: txnRef,
    vnp_Amount: Math.round(amount) * 100,
    vnp_TransactionNo: payment.vnpay_transaction_no || payment.vnpay_payload?.vnp_TransactionNo || '',
    vnp_TransactionDate: transactionDate,
    vnp_CreateBy: req.user.login_account || req.user.email || 'customer',
    vnp_CreateDate: formatVnpayDate(now),
    vnp_IpAddr: getRequestIp(req),
    vnp_OrderInfo: `Hoan tien dat phong ${reservation.booking_code}`
  };

  params.vnp_SecureHash = signRefundParams(params, config.hashSecret);

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.vnp_ResponseCode !== '00') {
    throw createHttpError(payload.vnp_Message || `VNPAY refund failed with code ${payload.vnp_ResponseCode || response.status}.`, 502);
  }

  return {
    payload,
    request: params,
    refundedAt: now
  };
};

const refundCompletedPayments = async ({ db, req, reservation, payments }) => {
  const refundResults = [];

  for (const payment of payments) {
    const amount = Number(payment.amount || 0);

    if (amount <= 0) {
      continue;
    }

    const refundResult = await callVnpayRefund({ req, reservation, payment, amount });
    refundResults.push(refundResult);

    await db.collection('payments').updateOne(
      { _id: payment._id },
      {
        $set: {
          status: 'Refunded',
          refund_status: 'Completed',
          refunded_at: refundResult.refundedAt,
          refund_amount: amount,
          vnpay_refund_payload: refundResult.payload,
          vnpay_refund_request: refundResult.request,
          updated_at: refundResult.refundedAt
        }
      }
    );
  }

  return refundResults;
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

  const assignedRooms = await getAvailablePhysicalRooms(
    db,
    roomType._id,
    occupancy.checkIn,
    occupancy.checkOut,
    occupancy.requiredRooms
  );

  if (assignedRooms.length < occupancy.requiredRooms) {
    throw createHttpError('No physical room is available for the selected date range. Please choose another date.', 409);
  }

  const now = new Date();
  const paymentExpiresAt = getPaymentExpiresAt(now);
  const pricePerNight = Number(roomType.base_price || roomType.price || 0);
  const totalAmount = pricePerNight * occupancy.nights * occupancy.requiredRooms;
  const assignedRoomIds = assignedRooms.map((room) => room._id);
  const reservation = {
    _id: new ObjectId(),
    booking_code: generateBookingCode(req.user),
    customer_id: req.user._id,
    room_type_id: roomType._id,
    room_id: assignedRoomIds[0] || null,
    assigned_room_ids: assignedRoomIds,
    room_assignment_status: 'Assigned',
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
    booking_status: 'PendingPayment',
    payment_expires_at: paymentExpiresAt,
    created_at: now,
    updated_at: now
  };

  await db.collection('reservations').insertOne(reservation);

  await db.collection('booking_rooms').insertMany(
    assignedRooms.map((room) => ({
      booking_id: reservation._id,
      room_id: room._id,
      room_type_id: roomType._id,
      room_number: room.room_number || room.roomName || '',
      status: 'Pending',
      check_in_date: occupancy.checkIn,
      check_out_date: occupancy.checkOut,
      created_at: now,
      updated_at: now
    }))
  );

  res.status(201).send({
    message: `Booking created. Please complete full payment within ${PAYMENT_HOLD_MINUTES} minutes to confirm your booking.`,
    reservation: mapReservation(reservation, roomType, assignedRooms[0] || null)
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
  const completedPayments = await getCompletedPayments(db, reservation._id);
  const paidAmount = getPaidAmount(completedPayments);
  const totalAmount = Number(reservation.total_amount || 0);
  const isFullyPaid = paidAmount >= totalAmount && totalAmount > 0;
  const refundEligible = reservation.check_in_date && new Date(reservation.check_in_date).getTime() - now.getTime() >= REFUND_ALLOWED_WINDOW_MS;
  const [roomType, assignedRoom] = await Promise.all([
    reservation.room_type_id ? db.collection('room_types').findOne({ _id: reservation.room_type_id }) : null,
    reservation.room_id ? db.collection('rooms').findOne({ _id: reservation.room_id }) : null
  ]);

  if (isFullyPaid && !refundEligible) {
    await sendReservationCancellationEmail({
      to: req.user.email,
      fullName: req.user.full_name,
      bookingCode: reservation.booking_code,
      supportPhone: SUPPORT_PHONE,
      kind: 'support-required',
      roomName: roomType?.name || '',
      roomNumber: assignedRoom?.room_number || assignedRoom?.roomName || '',
      checkInDate: reservation.check_in_date,
      checkOutDate: reservation.check_out_date,
      totalAmount,
      paidAmount,
      refundStatus: 'SupportRequired',
      paymentStatus: reservation.payment_status || ''
    });

    throw createHttpError(
      `Booking is within 48 hours of check-in. Please contact ${SUPPORT_PHONE} directly for cancellation and refund support.`,
      409
    );
  }

  let refundResults = [];

  if (paidAmount > 0 && refundEligible) {
    refundResults = await refundCompletedPayments({ db, req, reservation, payments: completedPayments });
  }

  await db.collection('reservations').updateOne(
    { _id: reservation._id },
    {
      $set: {
        booking_status: CANCELED_STATUS,
        canceled_at: now,
        cancel_reason: paidAmount > 0 ? 'Customer canceled with automatic refund' : 'Customer canceled',
        deposit_amount: paidAmount > 0 ? 0 : reservation.deposit_amount || 0,
        payment_status: paidAmount > 0 ? 'Refunded' : reservation.payment_status || 'Unpaid',
        refund_status: paidAmount > 0 ? 'Refunded' : 'NotRequired',
        updated_at: now
      }
    }
  );

  await db.collection('booking_rooms').updateMany(
    { booking_id: reservation._id },
    {
      $set: {
        status: CANCELED_STATUS,
        updated_at: now
      }
    }
  );

  const updatedReservation = await db.collection('reservations').findOne({ _id: reservation._id });

  await sendReservationCancellationEmail({
    to: req.user.email,
    fullName: req.user.full_name,
    bookingCode: updatedReservation.booking_code,
    supportPhone: SUPPORT_PHONE,
    refundAmount: paidAmount,
    kind: paidAmount > 0 ? 'refunded' : 'canceled',
    roomName: roomType?.name || '',
    roomNumber: assignedRoom?.room_number || assignedRoom?.roomName || '',
    checkInDate: updatedReservation.check_in_date,
    checkOutDate: updatedReservation.check_out_date,
    totalAmount: Number(updatedReservation.total_amount || totalAmount || 0),
    paidAmount,
    paymentStatus: updatedReservation.payment_status || '',
    refundStatus: updatedReservation.refund_status || '',
    refundResults
  });

  res.send({
    message: paidAmount > 0 ? 'Reservation canceled and refund request was completed through VNPAY.' : 'Reservation canceled.',
    reservation: mapReservation(updatedReservation, roomType, assignedRoom)
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


