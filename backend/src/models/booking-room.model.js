const mongoose = require('mongoose');

const bookingRoomSchema = new mongoose.Schema({
  booking_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  room_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  room_type_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  room_number:   { type: String, default: '' },  // denormalized for display
  status:        {
    type: String,
    enum: ['Pending', 'CheckedIn', 'CheckedOut'],
    default: 'Pending'
  },
  check_in_date:  { type: Date, required: true },
  check_out_date: { type: Date, required: true },
  created_at:     { type: Date, default: Date.now },
  updated_at:     { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'booking_rooms'
});

// Indexes
bookingRoomSchema.index({ booking_id: 1 });
bookingRoomSchema.index({ room_id: 1 });
bookingRoomSchema.index({ status: 1 });

const BookingRoom = mongoose.model('BookingRoom', bookingRoomSchema);

module.exports = BookingRoom;
