const mongoose = require('mongoose');

const staffTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    staff_type: {
      type: String,
      enum: ['housekeeping', 'technical'],
      required: true,
      default: 'housekeeping'
    },
    assigned_staff_id: {
      type: String,
      required: true,
      trim: true
    },
    assigned_to: {
      type: String,
      required: true,
      trim: true
    },
    room_number: {
      type: String,
      required: true,
      trim: true,
      match: /^[1-9][0-9]{2,3}$/
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'closed', 'cancelled'],
      default: 'assigned'
    },
    deadline: {
      type: Date,
      required: true
    },
    closed_at: Date,
    cancelled_at: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffTask', staffTaskSchema);
