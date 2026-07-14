const mongoose = require('mongoose');

const stayGuestSchema = new mongoose.Schema({
  booking_room_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'BookingRoom', required: true },
  user_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  full_name:        { type: String, required: true, trim: true },
  phone_number:     { type: String, default: '' },
  id_card_number:   { type: String, default: '' },
  passport_number:  { type: String, default: '' },
  id_card_image:    { type: String, default: '' },  // URL/path to captured photo
  document_type:    { type: String, enum: ['ID_CARD', 'PASSPORT', 'OTHER'], default: 'ID_CARD' },
  created_at:       { type: Date, default: Date.now },
  updated_at:       { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'stay_guests'
});

// Indexes
stayGuestSchema.index({ booking_room_id: 1 });
stayGuestSchema.index({ user_id: 1 });

const StayGuest = mongoose.model('StayGuest', stayGuestSchema);

module.exports = StayGuest;
