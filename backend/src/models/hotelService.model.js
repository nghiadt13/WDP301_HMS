const mongoose = require('mongoose');

const hotelServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    available_time: {
      type: String,
      trim: true,
      default: '',
    },
    image_url: {
      type: String,
      trim: true,
      default: '',
    },
    image_key: {
      type: String,
      trim: true,
      default: '',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'hotel_services',
  }
);

hotelServiceSchema.index({ category: 1, name: 1 });
hotelServiceSchema.index({ is_active: 1 });

module.exports = mongoose.model('HotelService', hotelServiceSchema);
