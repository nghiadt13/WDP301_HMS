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
        values: ['Available', 'Occupied', 'Maintenance', 'OutOfService'],
        message: 'Status must be Available, Occupied, Maintenance, or OutOfService',
      },
      default: 'Available',
    },
    totalRooms: {
      type: Number,
      required: [true, 'Total rooms is required'],
      min: [0, 'Total rooms cannot be negative'],
    },
    occupiedRooms: {
      type: Number,
      default: 0,
      min: [0, 'Occupied rooms cannot be negative'],
    },
    images: {
      type: [String],
      default: [],
    },
    amenity_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Amenity',
      },
    ],
    feature_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feature',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual fields ───────────────────────────────────────────
roomSchema.virtual('availableRooms').get(function () {
  return this.totalRooms - this.occupiedRooms;
});

roomSchema.virtual('occupancyRate').get(function () {
  if (this.totalRooms === 0) return 0;
  return Math.round((this.occupiedRooms / this.totalRooms) * 100);
});

// ─── Indexes ──────────────────────────────────────────────────
roomSchema.index({ room_type_id: 1 });
roomSchema.index({ isActive: 1 });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
