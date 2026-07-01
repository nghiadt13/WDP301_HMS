const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Amenity name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Amenity = mongoose.model('Amenity', amenitySchema, 'amenities');

module.exports = Amenity;
