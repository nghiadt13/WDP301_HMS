const mongoose = require('mongoose');

const asyncHandler = require('../../../utils/async-handler');
const { createHttpError } = require('../../../utils/error.utils');
const { parseDateOnly, parsePositiveInteger, addDays, getMonthStart, addMonths, toDateKey } = require('../../../utils/date.utils');
const { normalizeRoomName, getRoomOrder, getRoomQuantity } = require('../../../utils/room.utils');

const { ObjectId } = mongoose.Types;

const ADULTS_PER_ROOM = 2;
const CHILDREN_PER_ROOM = 1;
const ACTIVE_ROOM_TYPE_QUERY = {
  is_active: { $ne: false }
};
const ACTIVE_PHYSICAL_ROOM_QUERY = {
  isActive: { $ne: false },
  status: { $nin: ['Maintenance', 'OutOfService'] }
};
const REVIEWABLE_STATUS_PATTERN = /checkedin|checkedout|completed/i;

const toObjectId = (value) => (ObjectId.isValid(value) ? new ObjectId(value) : null);

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

  return reservations.reduce((total, reservation) => total + getRoomQuantity(reservation), 0);
};

const getTotalRoomsByType = (db, roomTypeId) =>
  db.collection('rooms').countDocuments({
    room_type_id: roomTypeId,
    ...ACTIVE_PHYSICAL_ROOM_QUERY
  });

const buildOccupancy = (query) => {
  const checkIn = parseDateOnly(query.checkIn);
  const checkOut = parseDateOnly(query.checkOut);
  const adults = parsePositiveInteger(query.adults, 1);
  const children = parsePositiveInteger(query.children, 0);

  if (!checkIn || !checkOut) {
    throw createHttpError('Please choose valid check-in and check-out dates.');
  }

  if (checkOut <= checkIn) {
    throw createHttpError('Check-out date must be after check-in date.');
  }

  if (adults < 1) {
    throw createHttpError('At least 1 adult is required to book a room.');
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
      ? `Can fit ${adults} adult(s) and ${children} child(ren) in ${requiredRooms} room(s).`
      : 'Children cannot occupy a room without an adult. Please increase adults or reduce children.'
  };
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

const mapRoomType = (roomType, availability = null) => {
  const features = Array.isArray(roomType.features) ? roomType.features : [];
  const images = Array.isArray(roomType.images) ? roomType.images : roomType.image_url ? [roomType.image_url] : [];
  const name = roomType.name || roomType.roomName || 'Room Type';

  return {
    id: String(roomType._id),
    name: normalizeRoomName(name),
    rawName: name,
    description: roomType.description || '',
    image: images[0] || '',
    images,
    area: roomType.area || features[0] || '',
    guests: roomType.guests || features[1] || (roomType.capacity ? `${roomType.capacity} Guests` : ''),
    beds: roomType.beds || features[2] || roomType.bed_type || '',
    facilities: Array.isArray(roomType.facilities) ? roomType.facilities : [],
    price: Number(roomType.base_price || roomType.price || 0),
    totalRooms: Number(roomType.totalRooms || 0),
    availability
  };
};

const sortRoomTypes = (roomTypes) => {
  return roomTypes.sort((firstRoomType, secondRoomType) => {
    const firstOrder = Number.isFinite(firstRoomType.display_order) ? firstRoomType.display_order : getRoomOrder(firstRoomType.name);
    const secondOrder = Number.isFinite(secondRoomType.display_order) ? secondRoomType.display_order : getRoomOrder(secondRoomType.name);

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    return String(firstRoomType.name || '').localeCompare(String(secondRoomType.name || ''), 'en', {
      numeric: true,
      sensitivity: 'base'
    });
  });
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

const getRoomReviews = async (db, roomType) => {
  const reservations = await db
    .collection('reservations')
    .find({ room_type_id: roomType._id })
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

  return Promise.all(feedbacks.map((feedback) => mapReview(db, feedback, normalizeRoomName(roomType.name))));
};

const getOtherRooms = async (db, roomTypeId) => {
  const roomTypes = await db
    .collection('room_types')
    .find({
      ...ACTIVE_ROOM_TYPE_QUERY,
      _id: { $ne: roomTypeId }
    })
    .toArray();

  return sortRoomTypes(roomTypes).slice(0, 5).map((roomType) => mapRoomType(roomType));
};

const withAvailability = async (db, roomType, occupancy) => {
  const [totalRooms, bookedRooms] = await Promise.all([
    getTotalRoomsByType(db, roomType._id),
    getBookedRooms(db, roomType._id, occupancy.checkIn, occupancy.checkOut)
  ]);
  const availableRooms = Math.max(0, totalRooms - bookedRooms);
  const canBook = occupancy.isAssignable && availableRooms >= occupancy.requiredRooms;

  return mapRoomType(
    {
      ...roomType,
      totalRooms
    },
    {
      totalRooms,
      bookedRooms,
      availableRooms,
      requiredRooms: occupancy.requiredRooms,
      canBook
    }
  );
};

const getRoomsWithAvailability = async (db, occupancy) => {
  const roomTypes = await db.collection('room_types').find(ACTIVE_ROOM_TYPE_QUERY).toArray();
  const sortedRoomTypes = sortRoomTypes(roomTypes);

  return Promise.all(sortedRoomTypes.map((roomType) => withAvailability(db, roomType, occupancy)));
};

const findReviewableReservation = async (db, customerId, roomTypeId) =>
  db.collection('reservations').findOne(
    {
      customer_id: customerId,
      room_type_id: roomTypeId,
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
  const roomTypes = await db.collection('room_types').find(ACTIVE_ROOM_TYPE_QUERY).toArray();
  const sortedRoomTypes = sortRoomTypes(roomTypes);

  const rooms = await Promise.all(
    sortedRoomTypes.map(async (roomType) =>
      mapRoomType({
        ...roomType,
        totalRooms: await getTotalRoomsByType(db, roomType._id)
      })
    )
  );

  res.send({
    hero: {
      image: 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/slide_1.jpg',
      title: 'PHONG NGHI',
      description:
        'Hotelify offers elegant room types with real room inventory for every stay need.'
    },
    rooms
  });
});

const getRoomDetail = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const roomTypeId = toObjectId(req.params.roomId || req.params.id);

  if (!roomTypeId) {
    throw createHttpError('Room type not found.', 404);
  }

  const roomType = await db.collection('room_types').findOne({
    _id: roomTypeId,
    is_active: { $ne: false }
  });

  if (!roomType) {
    throw createHttpError('Room type not found.', 404);
  }

  let availability = null;
  let search = null;
  let mappedRoom = mapRoomType(roomType);

  if (req.query.checkIn || req.query.checkOut) {
    const occupancy = buildOccupancy(req.query);
    mappedRoom = await withAvailability(db, roomType, occupancy);
    availability = mappedRoom.availability;

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
  } else {
    mappedRoom.totalRooms = await getTotalRoomsByType(db, roomType._id);
  }

  const [reviews, otherRooms] = await Promise.all([
    getRoomReviews(db, roomType),
    getOtherRooms(db, roomType._id)
  ]);

  res.send({
    room: mappedRoom,
    search,
    otherRooms,
    reviews
  });
});

const getRoomCalendar = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const roomTypeId = toObjectId(req.params.roomId || req.params.id);

  if (!roomTypeId) {
    throw createHttpError('Room type not found.', 404);
  }

  const roomType = await db.collection('room_types').findOne({
    _id: roomTypeId,
    is_active: { $ne: false }
  });

  if (!roomType) {
    throw createHttpError('Room type not found.', 404);
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const fromDate = parseDateOnly(req.query.from) || today;
  const monthStart = getMonthStart(fromDate);
  const months = Math.min(6, Math.max(1, parsePositiveInteger(req.query.months, 2)));
  const rangeEnd = addMonths(monthStart, months);
  const totalRooms = await getTotalRoomsByType(db, roomType._id);
  const occupancy = buildOccupancyCounts(req.query);

  const reservations = await db
    .collection('reservations')
    .find({
      room_type_id: roomType._id,
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
    roomId: String(roomType._id),
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
  const roomTypeId = toObjectId(req.params.roomId || req.params.id);

  if (!roomTypeId) {
    throw createHttpError('Room type not found.', 404);
  }

  const roomType = await db.collection('room_types').findOne({
    _id: roomTypeId,
    is_active: { $ne: false }
  });

  if (!roomType) {
    throw createHttpError('Room type not found.', 404);
  }

  const rating = Number.parseInt(req.body.rating, 10);
  const feedbackText = String(req.body.feedbackText || '').trim();

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw createHttpError('Please choose a rating from 1 to 5 stars.');
  }

  if (feedbackText.length < 5) {
    throw createHttpError('Review must be at least 5 characters.');
  }

  if (feedbackText.length > 1000) {
    throw createHttpError('Review cannot exceed 1000 characters.');
  }

  const reservation = await findReviewableReservation(db, req.user._id, roomType._id);

  if (!reservation) {
    throw createHttpError('You can only review this room type after a checked-in or completed booking.', 403);
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
    message: 'Thank you for your review.',
    review: await mapReview(db, feedback, normalizeRoomName(roomType.name))
  });
});

const getById = asyncHandler(async (req, res) => {
  const roomTypeId = toObjectId(req.params.id);

  if (!roomTypeId) {
    throw createHttpError('Invalid room type ID.', 400);
  }

  const db = mongoose.connection.db;
  const roomType = await db.collection('room_types').findOne({
    _id: roomTypeId,
    is_active: { $ne: false }
  });

  if (!roomType) {
    throw createHttpError('Room type not found.', 404);
  }

  res.send({ room: mapRoomType(roomType) });
});

module.exports = {
  listRooms,
  searchRooms,
  getRoomDetail,
  getRoomCalendar,
  submitRoomReview,
  getById,
};
