const PAYMENT_HOLD_MINUTES = Number(process.env.PAYMENT_HOLD_MINUTES || 15);

const PENDING_PAYMENT_STATUS_PATTERN = /pending/i;

const buildActiveReservationQuery = ({ roomTypeId, checkInDate, checkOutDate, now = new Date() }) => ({
  room_type_id: roomTypeId,
  booking_status: { $not: /cancel|expired/i },
  check_in_date: { $lt: checkOutDate },
  check_out_date: { $gt: checkInDate },
  $or: [
    { payment_status: 'Paid' },
    { booking_status: { $not: PENDING_PAYMENT_STATUS_PATTERN } },
    { payment_expires_at: { $gt: now } }
  ]
});

const expirePendingReservations = async (db, now = new Date()) => {
  return db.collection('reservations').updateMany(
    {
      payment_status: { $ne: 'Paid' },
      booking_status: PENDING_PAYMENT_STATUS_PATTERN,
      payment_expires_at: { $lte: now }
    },
    {
      $set: {
        booking_status: 'Canceled',
        canceled_at: now,
        cancel_reason: 'Payment timeout',
        updated_at: now
      }
    }
  );
};

const getPaymentExpiresAt = (createdAt = new Date()) =>
  new Date(createdAt.getTime() + PAYMENT_HOLD_MINUTES * 60 * 1000);

module.exports = {
  buildActiveReservationQuery,
  expirePendingReservations,
  getPaymentExpiresAt,
  PAYMENT_HOLD_MINUTES
};
