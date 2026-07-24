const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  invoice_code: { type: String, required: true, unique: true },
  room_charge: { type: Number, default: 0 },
  extra_charges: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  deposit_deducted: { type: Number, default: 0 },
  final_total: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Unpaid', 'Paid'],
    default: 'Unpaid'
  },
  payment_method: { type: String, default: null }, // e.g. Cash, Credit Card, Bank Transfer
  payment_date: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'invoices'
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
