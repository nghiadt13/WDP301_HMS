const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  booking_code:       { type: String, required: true, unique: true, trim: true },
  customer_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  room_type_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  room_id:            { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  check_in_date:      { type: Date, required: true },
  check_out_date:     { type: Date, required: true },
  guest_count:        { type: Number, default: 1, min: 1 },
  adult_count:        { type: Number, default: 1, min: 0 },
  child_count:        { type: Number, default: 0, min: 0 },
  room_quantity:      { type: Number, default: 1, min: 1 },
  special_request:    { type: String, default: '' },
  total_amount:       { type: Number, default: 0 },
  deposit_amount:     { type: Number, default: 0 },
  payment_status:     { type: String, enum: ['Unpaid', 'DepositPaid', 'Paid'], default: 'Unpaid' },
  booking_status:     {
    type: String,
    enum: ['Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Completed', 'Canceled', 'Checked-in', 'Checked-out'],
    default: 'Pending'
  },
  source:             { type: String, enum: ['Website', 'OTA', 'Walk-in', 'Phone', 'Other'], default: 'Website' },
  canceled_at:        { type: Date, default: null },
  created_at:         { type: Date, default: Date.now },
  updated_at:         { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'reservations'
});

// Normalize hyphenated status variants on save
bookingSchema.pre('save', function(next) {
  if (this.booking_status === 'Checked-in') this.booking_status = 'CheckedIn';
  if (this.booking_status === 'Checked-out') this.booking_status = 'CheckedOut';
  next();
});

// Also normalize on query/load if necessary using a getter or virtual,
// but for standard Mongoose model, normalizing on write/pre-save is usually sufficient.

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
