const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Feature name is required'],
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

const Feature = mongoose.model('Feature', featureSchema, 'features');

module.exports = Feature;
