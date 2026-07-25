const mongoose = require('mongoose');

const hotelPolicySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
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
  {
    timestamps: true,
    collection: 'hotel_policies',
  }
);

hotelPolicySchema.index({ is_active: 1, display_order: 1 });
hotelPolicySchema.index({ category: 1 });

module.exports = mongoose.model('HotelPolicy', hotelPolicySchema);
