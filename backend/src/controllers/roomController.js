const mongoose = require('mongoose');

const asyncHandler = require('../utils/asyncHandler');

const { ObjectId } = mongoose.Types;

const ADULTS_PER_ROOM = 2;
const CHILDREN_PER_ROOM = 1;
const ACTIVE_ROOM_QUERY = {
  roomName: /^PHONG /,
  isActive: { $ne: false }
};
const REVIEWABLE_STATUS_PATTERN = /checkedin|checkedout|completed/i;
const ROOM_DISPLAY_ORDER = [
  'PHONG DELUXE',
  'PHONG PREMIUM',
  'PHONG CLUB DELUXE TWIN',
  'PHONG CLUB PADDINGTON DELUXE',
  'PHONG GRAND SUITE',
  'PHONG PRESIDENT SUITE'
];

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

const toDateKey = (date) => date.toISOString().slice(0, 10);

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const getMonthStart = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const addMonths = (date, months) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));

const normalizeRoomName = (roomName = '') => roomName.replace(/^PHONG\b/i, 'PHÒNG');

const getRoomOrder = (roomName) => {
  const index = ROOM_DISPLAY_ORDER.indexOf(roomName);
  return index === -1 ? ROOM_DISPLAY_ORDER.length : index;
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

const buildOccupancy = (query) => {
  const checkIn = parseDateOnly(query.checkIn);
  const checkOut = parseDateOnly(query.checkOut);
  const adults = parsePositiveInteger(query.adults, 1);
  const children = parsePositiveInteger(query.children, 0);

  if (!checkIn || !checkOut) {
    throw createHttpError('Vui lòng chọn ngày đến và ngày đi hợp lệ.');
  }

  if (checkOut <= checkIn) {
    throw createHttpError('Ngày đi phải sau ngày đến.');
  }

  if (adults < 1) {
    throw createHttpError('Cần ít nhất 1 người lớn để đặt phòng.');
  }

  const adultRoomCount = Math.ceil(adults / ADULTS_PER_ROOM);
  const childRoomCount = children > 0 ? Math.ceil(children / CHILDREN_PER_ROOM) : 0;
  const requiredRooms = Math.max(adultRoomCount, childRoomCount, 1);
  const isAssignable = requiredRooms <= adults;

  return {
    checkIn,
    checkOut,
    checkInDate: query.checkIn,
    checkOutDate: query.checkOut,
    adults,
    children,
    requiredRooms,
    adultsPerRoom: ADULTS_PER_ROOM,
    childrenPerRoom: CHILDREN_PER_ROOM,
    isAssignable,
    message: isAssignable
      ? `Cần ${requiredRooms} phòng cho ${adults} người lớn và ${children} trẻ em.`
      : 'Trẻ em không thể tự đứng phòng. Vui lòng tăng số người lớn hoặc giảm số trẻ em.'
  };
};

const mapRoom = (room, availability = null) => {
  const features = Array.isArray(room.features) ? room.features : [];
  const images = Array.isArray(room.images) ? room.images : [];

  return {
    id: String(room._id),
    name: normalizeRoomName(room.roomName),
    rawName: room.roomName,
    description: room.description || '',
    image: images[0] || '',
    images,
    area: features[0] || '',
    guests: features[1] || '',
    beds: features[2] || '',
    facilities: Array.isArray(room.facilities) ? room.facilities : [],
    price: Number(room.price || room.base_price || 0),
    totalRooms: Number(room.totalRooms || 0),
    availability
  };
};

const mapReview = async (db, feedback, roomName = 'Hotelify Room') => {
  const customer = feedback.customer_id
    ? await db.collection('users').findOne({ _id: feedback.customer_id }, { projection: { full_name: 1, avatar: 1 } })
    : null;

  return {
    id: String(feedback._id),
    reservationId: feedback.reservation_id ? String(feedback.reservation_id) : '',
    title: roomName,
    customerName: customer?.full_name || 'Hotelify customer',
    customerAvatar: customer?.avatar || '',
    rating: Number(feedback.rating || 0),
    text: feedback.feedback_text || '',
    responseText: feedback.response_text || '',
    status: feedback.status || '',
    submittedAt: feedback.submitted_at || feedback.createdAt || null
  };
};

const getRoomReviews = async (db, room) => {
  const reservations = await db
    .collection('reservations')
    .find({ room_id: room._id })
    .project({ _id: 1 })
    .toArray();
  const reservationIds = reservations.map((reservation) => reservation._id);

  if (reservationIds.length === 0) {
    return [];
  }

  const feedbacks = await db
    .collection('feedbacks')
    .find({ reservation_id: { $in: reservationIds } })
    .sort({ submitted_at: -1 })
    .toArray();

  return Promise.all(feedbacks.map((feedback) => mapReview(db, feedback, normalizeRoomName(room.roomName))));
};

const getOtherRooms = async (db, roomId) => {
  const rooms = await db
    .collection('rooms')
    .find({
      ...ACTIVE_ROOM_QUERY,
      _id: { $ne: roomId }
    })
    .toArray();

  rooms.sort((firstRoom, secondRoom) => getRoomOrder(firstRoom.roomName) - getRoomOrder(secondRoom.roomName));

  return rooms.slice(0, 5).map((room) => mapRoom(room));
};

const getRoomsWithAvailability = async (db, occupancy) => {
  const rooms = await db.collection('rooms').find(ACTIVE_ROOM_QUERY).toArray();

  rooms.sort((firstRoom, secondRoom) => getRoomOrder(firstRoom.roomName) - getRoomOrder(secondRoom.roomName));

  return Promise.all(
    rooms.map(async (room) => {
      const bookedRooms = await getBookedRooms(db, room._id, occupancy.checkIn, occupancy.checkOut);
      const totalRooms = Number(room.totalRooms || 0);
      const availableRooms = Math.max(0, totalRooms - bookedRooms);
      const canBook = occupancy.isAssignable && availableRooms >= occupancy.requiredRooms;

      return mapRoom(room, {
        totalRooms,
        bookedRooms,
        availableRooms,
        requiredRooms: occupancy.requiredRooms,
        canBook
      });
    })
  );
};

const buildOccupancyCounts = (query) => {
  const adults = parsePositiveInteger(query.adults, 1);
  const children = parsePositiveInteger(query.children, 0);
  const adultRoomCount = Math.ceil(Math.max(adults, 1) / ADULTS_PER_ROOM);
  const childRoomCount = children > 0 ? Math.ceil(children / CHILDREN_PER_ROOM) : 0;
  const requiredRooms = Math.max(adultRoomCount, childRoomCount, 1);

  return {
    adults,
    children,
    requiredRooms,
    isAssignable: requiredRooms <= Math.max(adults, 1)
  };
};

const findReviewableReservation = async (db, customerId, roomId) =>
  db.collection('reservations').findOne(
    {
      customer_id: customerId,
      room_id: roomId,
      booking_status: REVIEWABLE_STATUS_PATTERN
    },
    {
      sort: {
        check_out_date: -1,
        check_in_date: -1,
        created_at: -1
      }
    }
  );

const searchRooms = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const occupancy = buildOccupancy(req.query);
  const rooms = await getRoomsWithAvailability(db, occupancy);

  res.send({
    search: {
      checkIn: occupancy.checkInDate,
      checkOut: occupancy.checkOutDate,
      adults: occupancy.adults,
      children: occupancy.children,
      requiredRooms: occupancy.requiredRooms,
      adultsPerRoom: occupancy.adultsPerRoom,
      childrenPerRoom: occupancy.childrenPerRoom,
      isAssignable: occupancy.isAssignable,
      message: occupancy.message
    },
    rooms
  });
});

const listRooms = asyncHandler(async (_req, res) => {
  const db = mongoose.connection.db;
  const rooms = await db.collection('rooms').find(ACTIVE_ROOM_QUERY).toArray();

  rooms.sort((firstRoom, secondRoom) => getRoomOrder(firstRoom.roomName) - getRoomOrder(secondRoom.roomName));

  res.send({
    hero: {
      image: 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/slide_1.jpg',
      title: 'PHÒNG NGHỈ',
      description:
        'Với vị trí đắc địa bên bờ Vịnh Hạ Long, Hotelify mang đến các hạng phòng nghỉ sang trọng, tiện nghi và phù hợp với nhiều nhu cầu lưu trú.'
    },
    rooms: rooms.map((room) => mapRoom(room))
  });
});

const getRoomDetail = asyncHandler(async (req, res) => {
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

  let availability = null;
  let search = null;

  if (req.query.checkIn || req.query.checkOut) {
    const occupancy = buildOccupancy(req.query);
    const bookedRooms = await getBookedRooms(db, room._id, occupancy.checkIn, occupancy.checkOut);
    const totalRooms = Number(room.totalRooms || 0);
    const availableRooms = Math.max(0, totalRooms - bookedRooms);

    availability = {
      totalRooms,
      bookedRooms,
      availableRooms,
      requiredRooms: occupancy.requiredRooms,
      canBook: occupancy.isAssignable && availableRooms >= occupancy.requiredRooms
    };

    search = {
      checkIn: occupancy.checkInDate,
      checkOut: occupancy.checkOutDate,
      adults: occupancy.adults,
      children: occupancy.children,
      requiredRooms: occupancy.requiredRooms,
      adultsPerRoom: occupancy.adultsPerRoom,
      childrenPerRoom: occupancy.childrenPerRoom,
      isAssignable: occupancy.isAssignable,
      message: occupancy.message
    };
  }

  const [reviews, otherRooms] = await Promise.all([
    getRoomReviews(db, room),
    getOtherRooms(db, room._id)
  ]);

  res.send({
    room: mapRoom(room, availability),
    search,
    otherRooms,
    reviews
  });
});

const getRoomCalendar = asyncHandler(async (req, res) => {
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

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const fromDate = parseDateOnly(req.query.from) || today;
  const monthStart = getMonthStart(fromDate);
  const months = Math.min(6, Math.max(1, parsePositiveInteger(req.query.months, 2)));
  const rangeEnd = addMonths(monthStart, months);
  const totalRooms = Number(room.totalRooms || 0);
  const occupancy = buildOccupancyCounts(req.query);

  const reservations = await db
    .collection('reservations')
    .find({
      room_id: room._id,
      booking_status: { $not: /cancel/i },
      check_in_date: { $lt: rangeEnd },
      check_out_date: { $gt: monthStart }
    })
    .project({ check_in_date: 1, check_out_date: 1, room_quantity: 1, room_count: 1, rooms_count: 1 })
    .toArray();

  const dates = [];

  for (let cursor = new Date(monthStart); cursor < rangeEnd; cursor = addDays(cursor, 1)) {
    const bookedRooms = reservations.reduce((total, reservation) => {
      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);
      return checkIn <= cursor && checkOut > cursor ? total + getRoomQuantity(reservation) : total;
    }, 0);
    const availableRooms = Math.max(0, totalRooms - bookedRooms);
    const isPast = cursor < today;

    dates.push({
      date: toDateKey(cursor),
      bookedRooms,
      availableRooms,
      isPast,
      isUnavailable: isPast || !occupancy.isAssignable || availableRooms < occupancy.requiredRooms
    });
  }

  res.send({
    roomId: String(room._id),
    totalRooms,
    requiredRooms: occupancy.requiredRooms,
    months,
    from: toDateKey(monthStart),
    to: toDateKey(rangeEnd),
    dates
  });
});

const submitRoomReview = asyncHandler(async (req, res) => {
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

  const rating = Number.parseInt(req.body.rating, 10);
  const feedbackText = String(req.body.feedbackText || '').trim();

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw createHttpError('Vui lòng chọn đánh giá từ 1 đến 5 sao.');
  }

  if (feedbackText.length < 5) {
    throw createHttpError('Bình luận cần tối thiểu 5 ký tự.');
  }

  if (feedbackText.length > 1000) {
    throw createHttpError('Bình luận không được vượt quá 1000 ký tự.');
  }

  const reservation = await findReviewableReservation(db, req.user._id, room._id);

  if (!reservation) {
    throw createHttpError('Bạn chỉ có thể bình luận sau khi đã từng đặt và check-in hoặc hoàn thành phòng này.', 403);
  }

  const now = new Date();
  const result = await db.collection('feedbacks').findOneAndUpdate(
    {
      reservation_id: reservation._id,
      customer_id: req.user._id
    },
    {
      $set: {
        reservation_id: reservation._id,
        customer_id: req.user._id,
        rating,
        feedback_text: feedbackText,
        status: 'Submitted',
        submitted_at: now,
        updated_at: now
      },
      $setOnInsert: {
        _id: new ObjectId()
      }
    },
    {
      upsert: true,
      returnDocument: 'after'
    }
  );

  const feedback =
    result.value ||
    (await db.collection('feedbacks').findOne({
      reservation_id: reservation._id,
      customer_id: req.user._id
    }));

  res.status(201).send({
    message: 'Cảm ơn bạn đã gửi đánh giá.',
    review: await mapReview(db, feedback, normalizeRoomName(room.roomName))
  });
});

module.exports = {
  getRoomCalendar,
  getRoomDetail,
  listRooms,
  searchRooms,
  submitRoomReview
};
