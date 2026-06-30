const mongoose = require('mongoose');

const customerFeedbackSchema = new mongoose.Schema(
  {
    customer_name: {
      type: String,
      trim: true,
      default: 'Customer'
    },
    customer_email: {
      type: String,
      trim: true,
      default: ''
    },
    room_number: {
      type: String,
      trim: true,
      default: ''
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    feedback_text: {
      type: String,
      required: true,
      trim: true
    },
    response_text: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['submitted', 'responded', 'archived'],
      default: 'submitted'
    },
    submitted_at: {
      type: Date,
      default: Date.now
    },
    responded_at: Date,
    archived_at: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomerFeedback', customerFeedbackSchema);
