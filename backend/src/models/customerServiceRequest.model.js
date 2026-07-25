const mongoose = require('mongoose');

const customerServiceRequestSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    room_number: {
      type: String,
      trim: true,
      default: '',
    },
    service_name: {
      type: String,
      trim: true,
      required: true,
    },
    service_category: {
      type: String,
      trim: true,
      default: 'Housekeeping',
    },
    assigned_department: {
      type: String,
      trim: true,
      default: 'Housekeeping',
    },
    assigned_staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assigned_to: {
      type: String,
      trim: true,
      default: 'Housekeeping Team',
    },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'in_progress', 'handled', 'canceled'],
      default: 'requested',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    internal_note: {
      type: String,
      trim: true,
      default: '',
    },
    requested_at: {
      type: Date,
      default: Date.now,
    },
    accepted_at: {
      type: Date,
      default: null,
    },
    started_at: {
      type: Date,
      default: null,
    },
    handled_at: {
      type: Date,
      default: null,
    },
    canceled_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'customer_service_requests',
  }
);

customerServiceRequestSchema.index({ assigned_department: 1, status: 1, room_number: 1 });
customerServiceRequestSchema.index({ customer_id: 1, requested_at: -1 });

module.exports = mongoose.model('CustomerServiceRequest', customerServiceRequestSchema);
