const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room type name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    bed_type: {
      type: String,
      default: '',
    },
    area: {
      type: String,
      default: '',
    },
    guests: {
      type: String,
      default: '',
    },
    beds: {
      type: String,
      default: '',
    },
    capacity: {
      type: Number,
      default: 1,
      min: 1,
    },
    base_price: {
      type: Number,
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    features: {
      type: [String],
      default: [],
    },
    facilities: {
      type: [String],
      default: [],
    },
    display_order: {
      type: Number,
      default: 999,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const RoomType = mongoose.model('RoomType', roomTypeSchema, 'room_types');

module.exports = RoomType;
