const mongoose = require('mongoose');

const asyncHandler = require('../utils/async-handler');
const { createHttpError } = require('../utils/error.utils');

const toDate = (value) => (value ? new Date(value) : null);

const differenceInNights = (start, end) => {
  const checkIn = toDate(start);
  const checkOut = toDate(end);

  if (!checkIn || !checkOut) {
    return 0;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / dayMs));
};

const mapStatus = (status) => {
  const normalizedStatus = String(status || '').toLowerCase();

  if (normalizedStatus.includes('cancel')) {
    return 'Canceled';
  }

  if (normalizedStatus.includes('checkedout') || normalizedStatus.includes('completed')) {
    return 'Completed';
  }

  if (normalizedStatus.includes('checkedin')) {
    return 'Checked-In';
  }

  return status || 'Pending';
};

const canCancelReservation = (status, checkInDate) => {
  if (!/pending|confirmed/i.test(String(status || ''))) {
    return false;
  }

  if (!checkInDate) {
    return true;
  }

  return new Date(checkInDate) > new Date();
};

const getFirstImage = (room, roomType) => {
  if (Array.isArray(room?.images) && room.images.length > 0) {
    return room.images[0];
  }

  if (room?.image_url) {
    return room.image_url;
  }

  if (!roomType) {
    return '';
  }

  if (Array.isArray(roomType.images) && roomType.images.length > 0) {
    return roomType.images[0];
  }

  return roomType.image_url || '';
};

const getGallery = (room, roomType) => {
  if (Array.isArray(room?.images) && room.images.length > 0) {
    return room.images;
  }

  if (room?.image_url) {
    return [room.image_url];
  }

  if (!roomType) {
    return [];
  }

  if (Array.isArray(roomType.images) && roomType.images.length > 0) {
    return roomType.images;
  }

  return roomType.image_url ? [roomType.image_url] : [];
};

const findRoomType = async (db, roomTypeId) => {
  if (!roomTypeId) {
    return null;
  }

  const roomType = await db.collection('room_types').findOne({ _id: roomTypeId });
  return roomType || null;
};

const enrichReservation = async (db, reservation) => {
  const [room, roomType] = await Promise.all([
    reservation.room_id ? db.collection('rooms').findOne({ _id: reservation.room_id }) : null,
    findRoomType(db, reservation.room_type_id)
  ]);

  return {
    id: reservation._id,
    bookingCode: reservation.booking_code,
    bookingDate: reservation.created_at || reservation.createdAt || reservation.created_at,
    roomType: room?.name || roomType?.name || 'Room',
    roomNumber: room?.room_number || room?.roomName || '',
    checkInDate: reservation.check_in_date,
    checkOutDate: reservation.check_out_date,
    guestCount: reservation.guest_count || 1,
    specialRequest: reservation.special_request || '',
    totalAmount: reservation.total_amount || 0,
    depositAmount: reservation.deposit_amount || 0,
    paymentStatus: reservation.payment_status || '',
    bookingStatus: reservation.booking_status || '',
    displayStatus: mapStatus(reservation.booking_status),
    canCancel: canCancelReservation(reservation.booking_status, reservation.check_in_date),
    durationNights: differenceInNights(reservation.check_in_date, reservation.check_out_date),
    image: getFirstImage(room, roomType),
    gallery: getGallery(room, roomType)
  };
};

const getProfileDashboard = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const customerId = req.user._id;

  const reservations = await db
    .collection('reservations')
    .find({ customer_id: customerId })
    .sort({ created_at: -1, check_in_date: -1 })
    .limit(10)
    .toArray();

  const bookingHistory = await Promise.all(
    reservations.map((reservation) => enrichReservation(db, reservation))
  );

  const currentStay =
    bookingHistory.find((reservation) => ['CheckedIn', 'Checked-In'].includes(reservation.bookingStatus)) ||
    bookingHistory.find((reservation) => ['Confirmed', 'Checked-In'].includes(reservation.displayStatus)) ||
    bookingHistory[0] ||
    null;

  const feedbacks = await db
    .collection('feedbacks')
    .find({ customer_id: customerId })
    .sort({ submitted_at: -1 })
    .limit(10)
    .toArray();

  const reviews = await Promise.all(
    feedbacks.map(async (feedback) => {
      const reservation = feedback.reservation_id
        ? await db.collection('reservations').findOne({ _id: feedback.reservation_id })
        : null;
      const [room, roomType] = reservation
        ? await Promise.all([
            reservation.room_id ? db.collection('rooms').findOne({ _id: reservation.room_id }) : null,
            findRoomType(db, reservation.room_type_id)
          ])
        : [null, null];

      return {
        id: feedback._id,
        reservationId: feedback.reservation_id,
        title: room?.name || roomType?.name || 'Hotel Stay',
        rating: feedback.rating || 0,
        text: feedback.feedback_text || '',
        responseText: feedback.response_text || '',
        status: feedback.status || '',
        submittedAt: feedback.submitted_at
      };
    })
  );

  const rewards = await db
    .collection('rewards')
    .find({ is_active: { $ne: false } })
    .sort({ sort_order: 1, created_at: 1 })
    .project({ _id: 1, title: 1, icon: 1, description: 1 })
    .toArray();

  const rewardItems = rewards.map((reward) => ({
    id: reward._id,
    title: reward.title,
    icon: reward.icon,
    description: reward.description || ''
  }));

  const membership =
    (await db.collection('customer_memberships').findOne({ customer_id: customerId })) ||
    {
      tier: 'Standard Member',
      points: 0,
      next_tier: '',
      points_to_next_tier: 0,
      progress_percent: 0,
      note: ''
    };

  res.send({
    user: req.user.toSafeObject(req.role),
    currentStay,
    bookingHistory,
    reviews,
    rewards: rewardItems,
    membership: {
      tier: membership.tier,
      points: membership.points || 0,
      nextTier: membership.next_tier || '',
      pointsToNextTier: membership.points_to_next_tier || 0,
      progressPercent: membership.progress_percent || 0,
      note: membership.note || ''
    }
  });
});

const normalizeText = (value) => String(value || '').trim();

const updateProfile = asyncHandler(async (req, res) => {
  const fullName = normalizeText(req.body.full_name || req.body.fullName);
  const phoneNumber = normalizeText(req.body.phone_number || req.body.phoneNumber);
  const address = normalizeText(req.body.address);
  const avatar = normalizeText(req.body.avatar);

  if (!fullName) {
    throw createHttpError('Full name is required.', 400);
  }

  if (fullName.length > 120) {
    throw createHttpError('Full name must be 120 characters or less.', 400);
  }

  if (phoneNumber && !/^[0-9+\-\s().]{8,20}$/.test(phoneNumber)) {
    throw createHttpError('Phone number is invalid.', 400);
  }

  if (address.length > 240) {
    throw createHttpError('Address must be 240 characters or less.', 400);
  }

  if (avatar.length > 500) {
    throw createHttpError('Avatar URL must be 500 characters or less.', 400);
  }

  req.user.full_name = fullName;
  req.user.phone_number = phoneNumber;
  req.user.address = address;
  req.user.avatar = avatar;
  await req.user.save();

  res.send({
    message: 'Profile updated successfully.',
    user: req.user.toSafeObject(req.role)
  });
});

module.exports = {
  getProfileDashboard,
  updateProfile
};
