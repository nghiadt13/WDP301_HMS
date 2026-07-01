const mongoose = require('mongoose');

const customerFeedbackSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    customer_name: {
      type: String,
      required: true,
      trim: true
    },
    customer_email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    room_number: {
      type: String,
      trim: true,
      default: ''
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
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
    feedback_history: [
      {
        room_number: {
          type: String,
          trim: true,
          default: ''
        },
        rating: {
          type: Number,
          min: 1,
          max: 5
        },
        feedback_text: {
          type: String,
          trim: true,
          default: ''
        },
        response_text: {
          type: String,
          trim: true,
          default: ''
        },
        status: {
          type: String,
          default: 'submitted'
        },
        submitted_at: {
          type: Date,
          default: null
        },
        responded_at: {
          type: Date,
          default: null
        },
        saved_at: {
          type: Date,
          default: Date.now
        }
      }
    ],
    status: {
      type: String,
      enum: ['submitted', 'responded', 'archived'],
      default: 'submitted'
    },
    submitted_at: {
      type: Date,
      default: Date.now
    },
    responded_at: {
      type: Date,
      default: null
    },
    archived_at: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'customer_feedbacks'
  }
);

module.exports = mongoose.model('CustomerFeedback', customerFeedbackSchema);

