const mongoose = require('mongoose');

const customerServiceRequestSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hotel_service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HotelService',
      default: null,
    },
    service_code: {
      type: String,
      trim: true,
      default: '',
    },
    service_name: {
      type: String,
      required: true,
      trim: true,
    },
    service_category: {
      type: String,
      trim: true,
      default: '',
    },
    room_number: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['requested', 'canceled', 'handled'],
      default: 'requested',
    },
    requested_at: {
      type: Date,
      default: Date.now,
    },
    canceled_at: {
      type: Date,
      default: null,
    },
    handled_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'service_requests',
  }
);

customerServiceRequestSchema.index({ customer_id: 1, requested_at: -1 });
customerServiceRequestSchema.index({ status: 1 });

module.exports = mongoose.model('CustomerServiceRequest', customerServiceRequestSchema);
