const mongoose = require('mongoose');

const managerResponseSchema = new mongoose.Schema(
  {
    responseText: {
      type: String,
      required: true,
      trim: true,
    },
    responderId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    responderName: {
      type: String,
      trim: true,
      default: 'Manager',
    },
    respondedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const customerFeedbackSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    reservation_id: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    customer_name: {
      type: String,
      trim: true,
      default: 'Khach hang',
    },
    customer_email: {
      type: String,
      trim: true,
      default: '',
    },
    room_number: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    feedback_text: {
      type: String,
      required: true,
      trim: true,
    },
    response_text: {
      type: String,
      trim: true,
      default: '',
    },
    manager_responses: {
      type: [managerResponseSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['submitted', 'responded', 'archived', 'Submitted', 'Responded', 'Archived'],
      default: 'submitted',
    },
    submitted_at: {
      type: Date,
      default: Date.now,
    },
    responded_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'feedbacks',
  }
);

customerFeedbackSchema.index({ rating: 1, status: 1 });
customerFeedbackSchema.index({ submitted_at: -1 });

module.exports = mongoose.model('CustomerFeedback', customerFeedbackSchema);
