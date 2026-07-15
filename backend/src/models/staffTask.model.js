const mongoose = require('mongoose');

const staffTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    staff_type: {
      type: String,
      enum: ['housekeeping', 'technical'],
      default: 'housekeeping',
    },
    assigned_staff_id: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    assigned_to: {
      type: String,
      trim: true,
      default: '',
    },
    room_number: {
      type: String,
      trim: true,
      required: [true, 'Room number is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['NotStarted', 'Assigned', 'Accepted', 'Cleaning', 'InProgress', 'In Progress', 'WaitingMaintenance', 'Completed', 'Cancelled'],
      default: 'NotStarted',
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    assignedBy: {
      type: String,
      trim: true,
      default: 'Receptionist',
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cleaningType: {
      type: String,
      trim: true,
      default: 'Checkout Cleaning',
    },
    receptionistNote: {
      type: String,
      trim: true,
      default: '',
    },
    guestRequest: {
      type: String,
      trim: true,
      default: '',
    },
    checkoutTime: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'staff_tasks',
  }
);

staffTaskSchema.index({ staff_type: 1, status: 1 });
staffTaskSchema.index({ deadline: 1 });

module.exports = mongoose.model('StaffTask', staffTaskSchema);
