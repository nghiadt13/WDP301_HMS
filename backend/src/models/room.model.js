const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
      unique: true,
      trim: true,
    },
    room_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'Room type is required'],
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['Available', 'Occupied', 'Dirty', 'Cleaning', 'Maintenance'],
        message: 'Status must be Available, Occupied, Dirty, Cleaning, or Maintenance',
      },
      default: 'Available',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    currentGuest: {
      type: String,
      trim: true,
      default: '',
    },
    inspectionStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Skipped'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────
roomSchema.index({ room_type_id: 1 });
roomSchema.index({ isActive: 1 });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
