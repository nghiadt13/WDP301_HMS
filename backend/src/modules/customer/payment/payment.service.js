const mongoose = require('mongoose');
const asyncHandler = require('../../../utils/async-handler');
const { createHttpError } = require('../../../utils/error.utils');

const { ObjectId } = mongoose.Types;

const getVietQrConfig = () => {
  const bankId = process.env.VIETQR_BANK_ID || process.env.VIETQR_BANK_BIN || process.env.VIETQR_BANK_CODE;
  const accountNo = process.env.VIETQR_ACCOUNT_NO;
  const accountName = process.env.VIETQR_ACCOUNT_NAME || '';

  if (!bankId || !accountNo) {
    throw createHttpError('VietQR bank account is not configured on the server.', 500);
  }

  return {
    accountName,
    accountNo,
    bankId,
    template: process.env.VIETQR_TEMPLATE || 'compact2'
  };
};

const normalizeForMatching = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const buildTransferContent = (reservation) =>
  `HTF${normalizeForMatching(reservation.booking_code).slice(0, 30)}`;

const buildVietQrUrl = ({ amount, transferContent }) => {
  const config = getVietQrConfig();
  const baseUrl = process.env.VIETQR_IMAGE_BASE_URL || 'https://img.vietqr.io/image';
  const params = new URLSearchParams({
    amount: String(Math.round(Number(amount || 0))),
    addInfo: transferContent
  });

  if (config.accountName) {
    params.set('accountName', config.accountName);
  }

  return `${baseUrl}/${config.bankId}-${config.accountNo}-${config.template}.png?${params.toString()}`;
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
    transferContent: payment.transfer_content || '',
    qrUrl: payment.qr_url || ''
  };
};

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

  if (/pending/i.test(String(reservation.booking_status || ''))) {
    update.booking_status = 'Confirmed';
  }

  await db.collection('reservations').updateOne(
    { _id: reservation._id },
    { $set: update }
  );

  return update;
};

const createVietQrPayment = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const reservation = await getReservationForCustomer(db, req.params.reservationId, req.user._id);
  const totalAmount = Number(reservation.total_amount || 0);

  if (totalAmount <= 0) {
    throw createHttpError('Reservation amount is invalid.', 400);
  }

  const completedPayments = await getCompletedPayments(db, reservation._id);
  const paidAmount = getPaidAmount(completedPayments);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  if (remainingAmount <= 0 || /^paid$/i.test(String(reservation.payment_status || ''))) {
    return res.send({
      message: 'Reservation is already paid.',
      paidAmount,
      remainingAmount: 0,
      paymentStatus: 'Paid'
    });
  }

  const now = new Date();
  const transferContent = buildTransferContent(reservation);
  const qrUrl = buildVietQrUrl({ amount: remainingAmount, transferContent });
  const transactionId = `VIETQR-${transferContent}`;

  const result = await db.collection('payments').findOneAndUpdate(
    {
      reservation_id: reservation._id,
      payment_method: 'VietQR',
      transaction_id: transactionId,
      status: 'Pending'
    },
    {
      $set: {
        invoice_id: reservation.invoice_id || null,
        amount: remainingAmount,
        qr_url: qrUrl,
        transfer_content: transferContent,
        updated_at: now
      },
      $setOnInsert: {
        _id: new ObjectId(),
        reservation_id: reservation._id,
        payment_method: 'VietQR',
        status: 'Pending',
        transaction_id: transactionId,
        created_at: now
      }
    },
    {
      returnDocument: 'after',
      upsert: true
    }
  );

  const payment =
    result.value ||
    (await db.collection('payments').findOne({
      reservation_id: reservation._id,
      payment_method: 'VietQR',
      transaction_id: transactionId,
      status: 'Pending'
    }));

  res.send({
    amount: remainingAmount,
    bank: {
      accountName: process.env.VIETQR_ACCOUNT_NAME || '',
      accountNo: process.env.VIETQR_ACCOUNT_NO || '',
      bankId: process.env.VIETQR_BANK_ID || process.env.VIETQR_BANK_BIN || process.env.VIETQR_BANK_CODE || ''
    },
    paidAmount,
    payment: mapPayment(payment),
    qrUrl,
    remainingAmount,
    transferContent
  });
});

const createMockPayment = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const reservation = await getReservationForCustomer(db, req.params.reservationId, req.user._id);
  const totalAmount = Number(reservation.total_amount || 0);

  if (totalAmount <= 0) {
    throw createHttpError('Reservation amount is invalid.', 400);
  }

  const completedPayments = await getCompletedPayments(db, reservation._id);
  const paidAmount = getPaidAmount(completedPayments);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  if (remainingAmount <= 0 || /^paid$/i.test(String(reservation.payment_status || ''))) {
    return res.send({
      message: 'Reservation is already paid.',
      paidAmount,
      remainingAmount: 0,
      paymentStatus: 'Paid'
    });
  }

  const now = new Date();
  const transactionId = `MOCK-${normalizeForMatching(reservation.booking_code).slice(0, 24)}-${Date.now().toString(36).toUpperCase()}`;
  const payment = {
    _id: new ObjectId(),
    reservation_id: reservation._id,
    invoice_id: reservation.invoice_id || null,
    payment_method: 'MockAPI',
    amount: remainingAmount,
    transaction_id: transactionId,
    status: 'Completed',
    paid_at: now,
    created_at: now,
    updated_at: now,
    mock_payload: {
      provider: 'Hotelify MockAPI',
      cardLast4: String(req.body.cardLast4 || '4242').slice(-4),
      approved: true
    }
  };

  await db.collection('payments').insertOne(payment);

  const newPaidAmount = paidAmount + remainingAmount;
  const reservationUpdate = await updateReservationAfterPayment(db, reservation, newPaidAmount, now);

  res.status(201).send({
    message: 'MockAPI payment completed successfully.',
    paidAmount: newPaidAmount,
    payment: mapPayment(payment),
    paymentStatus: reservationUpdate.payment_status,
    remainingAmount: Math.max(0, totalAmount - newPaidAmount),
    totalAmount
  });
});

const getReservationPaymentStatus = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const reservation = await getReservationForCustomer(db, req.params.reservationId, req.user._id);
  const payments = await db.collection('payments').find({ reservation_id: reservation._id }).sort({ created_at: -1 }).toArray();
  const paidAmount = getPaidAmount(payments.filter((payment) => payment.status === 'Completed'));

  res.send({
    paidAmount,
    paymentStatus: reservation.payment_status || 'Unpaid',
    payments: payments.map(mapPayment),
    remainingAmount: Math.max(0, Number(reservation.total_amount || 0) - paidAmount),
    totalAmount: Number(reservation.total_amount || 0)
  });
});

module.exports = {
  createMockPayment,
  createVietQrPayment,
  getReservationPaymentStatus
};
