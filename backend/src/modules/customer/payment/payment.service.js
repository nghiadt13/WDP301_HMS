const crypto = require('crypto');
const mongoose = require('mongoose');
const asyncHandler = require('../../../utils/async-handler');
const { createHttpError } = require('../../../utils/error.utils');
const { expirePendingReservations } = require('../../../utils/reservation-status.utils');

const { ObjectId } = mongoose.Types;

const VNPAY_PAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNPAY_VERSION = '2.1.0';
const VNPAY_COMMAND = 'pay';
const VNPAY_CURRENCY = 'VND';
const VNPAY_ORDER_TYPE = 'other';

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

const normalizeForMatching = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const getClientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

const getVnpayConfig = () => {
  const tmnCode = process.env.VNPAY_TMN_CODE;
  const hashSecret = process.env.VNPAY_HASH_SECRET;

  if (!tmnCode || !hashSecret) {
    throw createHttpError('VNPAY sandbox is not configured on the server.', 500);
  }

  return {
    hashSecret,
    payUrl: process.env.VNPAY_PAY_URL || VNPAY_PAY_URL,
    returnUrl: process.env.VNPAY_RETURN_URL,
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

const sortObject = (source) =>
  Object.keys(source)
    .sort()
    .reduce((result, key) => {
      if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
        result[key] = String(source[key]);
      }

      return result;
    }, {});

const encodeVnpayValue = (value) => encodeURIComponent(String(value)).replace(/%20/g, '+');

const buildVnpayQuery = (params) =>
  Object.entries(sortObject(params))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeVnpayValue(value)}`)
    .join('&');

const signVnpayParams = (params, hashSecret) =>
  crypto.createHmac('sha512', hashSecret).update(buildVnpayQuery(params), 'utf8').digest('hex');

const removeSignatureParams = (params) => {
  const cleanParams = { ...params };
  delete cleanParams.vnp_SecureHash;
  delete cleanParams.vnp_SecureHashType;
  return cleanParams;
};

const getVnpayReturnUrl = (req) => {
  const config = getVnpayConfig();

  if (config.returnUrl) {
    return config.returnUrl;
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host');

  return `${protocol}://${host}/api/payments/vnpay/return`;
};

const mapPayment = (payment) => {
  if (!payment) return null;

  return {
    id: String(payment._id),
    reservationId: payment.reservation_id ? String(payment.reservation_id) : '',
    paymentMethod: payment.payment_method || '',
    amount: Number(payment.amount || 0),
    transactionId: payment.transaction_id || '',
    status: payment.status || '',
    paidAt: payment.paid_at || null,
    vnpayTransactionNo: payment.vnpay_transaction_no || ''
  };
};

const mapHotelPolicy = (policy) => ({
  id: String(policy._id),
  title: policy.title || '',
  category: policy.category || '',
  content: policy.content || '',
  displayOrder: Number(policy.display_order || 0)
});

const getActiveHotelPolicies = async (db) =>
  db
    .collection('hotel_policies')
    .find({ is_active: true })
    .sort({ display_order: 1, createdAt: 1, _id: 1 })
    .toArray();

const isPolicyAccepted = (value) => value === true || value === 'true' || value === 1 || value === '1';

const getReservationForCustomer = async (db, reservationId, customerId) => {
  if (!ObjectId.isValid(reservationId)) {
    throw createHttpError('Reservation not found.', 404);
  }

  const reservation = await db.collection('reservations').findOne({
    _id: new ObjectId(reservationId),
    customer_id: customerId
  });

  if (!reservation) {
    throw createHttpError('Reservation not found for this account.', 404);
  }

  return reservation;
};

const getCompletedPayments = async (db, reservationId) =>
  db
    .collection('payments')
    .find({
      reservation_id: reservationId,
      status: 'Completed'
    })
    .toArray();

const getPaidAmount = (payments) => payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);

const updateReservationAfterPayment = async (db, reservation, paidAmount, now) => {
  const totalAmount = Number(reservation.total_amount || 0);
  const isFullyPaid = paidAmount >= totalAmount;

  const update = {
    deposit_amount: paidAmount,
    payment_status: isFullyPaid ? 'Paid' : 'DepositPaid',
    updated_at: now
  };

  if (isFullyPaid && /pending/i.test(String(reservation.booking_status || ''))) {
    update.booking_status = 'Confirmed';
  }

  await db.collection('reservations').updateOne(
    { _id: reservation._id },
    { $set: update }
  );

  return update;
};

const buildPaymentRedirectUrl = (reservationId, status, message) => {
  const params = new URLSearchParams({ vnpayStatus: status });

  if (message) {
    params.set('message', message);
  }

  return `${getClientUrl()}/payment/${reservationId}?${params.toString()}`;
};

const createVnpayPayment = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  await expirePendingReservations(db);
  const config = getVnpayConfig();
  const reservation = await getReservationForCustomer(db, req.params.reservationId, req.user._id);
  const totalAmount = Number(reservation.total_amount || 0);
  const activePolicies = await getActiveHotelPolicies(db);

  if (!isPolicyAccepted(req.body.acceptedHotelPolicies || req.body.accepted_hotel_policies)) {
    throw createHttpError('Please agree to the hotel policies before payment.', 400);
  }

  if (totalAmount <= 0) {
    throw createHttpError('Reservation amount is invalid.', 400);
  }

  if (/cancel/i.test(String(reservation.booking_status || ''))) {
    throw createHttpError('This booking is canceled or payment time has expired. Please create a new booking.', 400);
  }

  if (
    reservation.payment_status !== 'Paid' &&
    reservation.payment_expires_at &&
    new Date(reservation.payment_expires_at) <= new Date()
  ) {
    await expirePendingReservations(db);
    throw createHttpError('Payment time has expired. Please create a new booking.', 400);
  }

  const completedPayments = await getCompletedPayments(db, reservation._id);
  const paidAmount = getPaidAmount(completedPayments);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  if (remainingAmount <= 0 || /^paid$/i.test(String(reservation.payment_status || ''))) {
    return res.send({
      message: 'Reservation is already paid.',
      paidAmount,
      paymentStatus: 'Paid',
      remainingAmount: 0
    });
  }

  const now = new Date();
  const expireDate = new Date(now.getTime() + 15 * 60 * 1000);
  const bookingCode = normalizeForMatching(reservation.booking_code).slice(0, 24);
  const txnRef = `${bookingCode}-${Date.now().toString(36).toUpperCase()}`;
  const orderInfo = `Thanh toan dat phong ${reservation.booking_code}`;

  const payment = {
    _id: new ObjectId(),
    reservation_id: reservation._id,
    invoice_id: reservation.invoice_id || null,
    payment_method: 'VNPAY',
    amount: remainingAmount,
    transaction_id: txnRef,
    accepted_hotel_policy_at: now,
    accepted_hotel_policy_ids: activePolicies.map((policy) => policy._id),
    status: 'Pending',
    created_at: now,
    updated_at: now
  };

  await db.collection('payments').insertOne(payment);

  const vnpayParams = {
    vnp_Amount: Math.round(remainingAmount) * 100,
    vnp_Command: VNPAY_COMMAND,
    vnp_CreateDate: formatVnpayDate(now),
    vnp_CurrCode: VNPAY_CURRENCY,
    vnp_ExpireDate: formatVnpayDate(expireDate),
    vnp_IpAddr: getRequestIp(req),
    vnp_Locale: req.body.locale || 'vn',
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: VNPAY_ORDER_TYPE,
    vnp_ReturnUrl: getVnpayReturnUrl(req),
    vnp_TmnCode: config.tmnCode,
    vnp_TxnRef: txnRef,
    vnp_Version: VNPAY_VERSION
  };

  const queryString = buildVnpayQuery(vnpayParams);
  const secureHash = signVnpayParams(vnpayParams, config.hashSecret);
  const paymentUrl = `${config.payUrl}?${queryString}&vnp_SecureHash=${secureHash}`;

  res.status(201).send({
    amount: remainingAmount,
    payment: mapPayment(payment),
    paymentUrl,
    paidAmount,
    remainingAmount,
    transactionId: txnRef
  });
});

const getHotelPolicies = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const policies = await getActiveHotelPolicies(db);

  res.send({
    policies: policies.map(mapHotelPolicy)
  });
});

const handleVnpayReturn = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const config = getVnpayConfig();
  const receivedSecureHash = req.query.vnp_SecureHash;
  const verifiedHash = signVnpayParams(removeSignatureParams(req.query), config.hashSecret);
  const txnRef = req.query.vnp_TxnRef;
  const now = new Date();

  const payment = await db.collection('payments').findOne({
    payment_method: 'VNPAY',
    transaction_id: txnRef
  });

  if (!payment) {
    return res.redirect(`${getClientUrl()}/booking?paymentStatus=not-found`);
  }

  const reservation = await db.collection('reservations').findOne({ _id: payment.reservation_id });
  const redirectToPayment = (status, message) =>
    res.redirect(buildPaymentRedirectUrl(String(payment.reservation_id), status, message));

  if (!reservation) {
    await db.collection('payments').updateOne(
      { _id: payment._id },
      {
        $set: {
          status: 'Failed',
          updated_at: now,
          vnpay_payload: req.query
        }
      }
    );
    return redirectToPayment('failed', 'Reservation not found.');
  }

  if (!receivedSecureHash || String(receivedSecureHash).toLowerCase() !== verifiedHash.toLowerCase()) {
    await db.collection('payments').updateOne(
      { _id: payment._id },
      {
        $set: {
          status: 'Failed',
          updated_at: now,
          vnpay_payload: req.query
        }
      }
    );
    return redirectToPayment('failed', 'Invalid VNPAY signature.');
  }

  const isSuccessful = req.query.vnp_ResponseCode === '00' && req.query.vnp_TransactionStatus === '00';
  const paymentStatus = isSuccessful ? 'Completed' : 'Failed';
  const paidAt = isSuccessful ? now : payment.paid_at || null;

  await db.collection('payments').updateOne(
    { _id: payment._id },
    {
      $set: {
        paid_at: paidAt,
        status: paymentStatus,
        updated_at: now,
        vnpay_bank_code: req.query.vnp_BankCode || '',
        vnpay_card_type: req.query.vnp_CardType || '',
        vnpay_payload: req.query,
        vnpay_response_code: req.query.vnp_ResponseCode || '',
        vnpay_transaction_no: req.query.vnp_TransactionNo || ''
      }
    }
  );

  if (!isSuccessful) {
    return redirectToPayment('failed', `VNPAY response code ${req.query.vnp_ResponseCode || 'unknown'}.`);
  }

  const completedPayments = await getCompletedPayments(db, reservation._id);
  const paidAmount = getPaidAmount(completedPayments);
  await updateReservationAfterPayment(db, reservation, paidAmount, now);

  return redirectToPayment('success', 'Payment completed.');
});

const getReservationPaymentStatus = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  await expirePendingReservations(db);
  const reservation = await getReservationForCustomer(db, req.params.reservationId, req.user._id);
  const payments = await db.collection('payments').find({ reservation_id: reservation._id }).sort({ created_at: -1 }).toArray();
  const paidAmount = getPaidAmount(payments.filter((payment) => payment.status === 'Completed'));

  res.send({
    paidAmount,
    paymentStatus: reservation.payment_status || 'Unpaid',
    paymentExpiresAt: reservation.payment_expires_at || null,
    payments: payments.map(mapPayment),
    remainingAmount: Math.max(0, Number(reservation.total_amount || 0) - paidAmount),
    totalAmount: Number(reservation.total_amount || 0)
  });
});

module.exports = {
  createVnpayPayment,
  getHotelPolicies,
  getReservationPaymentStatus,
  handleVnpayReturn
};
