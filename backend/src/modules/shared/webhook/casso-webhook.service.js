const mongoose = require('mongoose');
const asyncHandler = require('../../../utils/async-handler');
const { createHttpError } = require('../../../utils/error.utils');

const { ObjectId } = mongoose.Types;

const normalizeForMatching = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const extractCassoTransactions = (payload) => {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (payload?.data && typeof payload.data === 'object') {
    return [payload.data];
  }

  if (Array.isArray(payload?.transactions)) {
    return payload.transactions;
  }

  return [];
};

const getCassoAmount = (transaction) =>
  Number(transaction.amount ?? transaction.creditAmount ?? transaction.credit ?? transaction.transferAmount ?? 0);

const getCassoDescription = (transaction) =>
  String(transaction.description || transaction.content || transaction.addInfo || transaction.remark || '');

const getCassoTransactionId = (transaction) =>
  String(transaction.id || transaction.tid || transaction.transaction_id || transaction.reference || transaction.refNo || '');

const getCompletedPayments = async (db, reservationId) =>
  db
    .collection('payments')
    .find({
      reservation_id: reservationId,
      status: 'Completed'
    })
    .toArray();

const getPaidAmount = (payments) => payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);

const updateReservationPaymentStatus = async (db, reservation, paidAmount, now = new Date()) => {
  const totalAmount = Number(reservation.total_amount || 0);
  const nextPaymentStatus = paidAmount >= totalAmount ? 'Paid' : paidAmount > 0 ? 'DepositPaid' : 'Unpaid';
  const update = {
    deposit_amount: Math.min(paidAmount, totalAmount),
    payment_status: nextPaymentStatus,
    updated_at: now
  };

  if (/pending/i.test(String(reservation.booking_status || ''))) {
    update.booking_status = 'Confirmed';
  }

  await db.collection('reservations').updateOne({ _id: reservation._id }, { $set: update });

  return nextPaymentStatus;
};

const handleCassoWebhook = asyncHandler(async (req, res) => {
  const webhookToken = process.env.CASSO_WEBHOOK_TOKEN || process.env.CASSO_SECURE_TOKEN;
  const requestToken = req.get('secure-token') || req.get('x-casso-signature') || req.get('x-casso-token');

  if (webhookToken && requestToken !== webhookToken) {
    throw createHttpError('Invalid Casso webhook token.', 401);
  }

  const db = mongoose.connection.db;
  const transactions = extractCassoTransactions(req.body);
  const processed = [];

  for (const transaction of transactions) {
    const amount = getCassoAmount(transaction);
    const description = getCassoDescription(transaction);
    const normalizedDescription = normalizeForMatching(description);
    const cassoTransactionId = getCassoTransactionId(transaction);

    if (!amount || amount <= 0 || !normalizedDescription) {
      processed.push({ matched: false, reason: 'missing_amount_or_description' });
      continue;
    }

    const pendingPayments = await db
      .collection('payments')
      .find({
        payment_method: 'VietQR',
        status: 'Pending',
        transfer_content: { $exists: true, $ne: '' }
      })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();

    const matchedPayment = pendingPayments.find((payment) =>
      normalizedDescription.includes(normalizeForMatching(payment.transfer_content))
    );

    if (!matchedPayment) {
      processed.push({ matched: false, reason: 'no_pending_payment_match', transactionId: cassoTransactionId });
      continue;
    }

    const reservation = await db.collection('reservations').findOne({ _id: matchedPayment.reservation_id });
    if (!reservation) {
      processed.push({ matched: false, reason: 'reservation_not_found', transactionId: cassoTransactionId });
      continue;
    }

    const now = new Date();
    const paidAmount = Math.min(Number(amount), Number(matchedPayment.amount || amount));

    await db.collection('payments').updateOne(
      { _id: matchedPayment._id },
      {
        $set: {
          amount: paidAmount,
          casso_transaction_id: cassoTransactionId,
          casso_payload: transaction,
          payment_method: 'VietQR',
          status: 'Completed',
          paid_at: transaction.when ? new Date(transaction.when) : now,
          updated_at: now
        }
      }
    );

    const completedPayments = await getCompletedPayments(db, reservation._id);
    const totalPaid = getPaidAmount(completedPayments);
    const paymentStatus = await updateReservationPaymentStatus(db, reservation, totalPaid, now);

    processed.push({
      amount: paidAmount,
      matched: true,
      paymentId: String(matchedPayment._id),
      paymentStatus,
      reservationId: String(reservation._id),
      transactionId: cassoTransactionId
    });
  }

  res.send({
    message: 'Casso webhook processed',
    processed
  });
});

module.exports = {
  handleCassoWebhook
};
