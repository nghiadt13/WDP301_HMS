const mongoose = require('mongoose');

const bookingChargeSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null }, // Optional, to specify which room incurred the charge
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  charge_type: { 
    type: String, 
    enum: ['minibar', 'damage', 'service', 'other'], 
    default: 'other' 
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'booking_charges'
});

bookingChargeSchema.index({ booking_id: 1 });

const BookingCharge = mongoose.model('BookingCharge', bookingChargeSchema);

module.exports = BookingCharge;
