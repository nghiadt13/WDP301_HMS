const mongoose = require('mongoose');

const staffTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [120, 'Task title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Task description cannot exceed 1000 characters'],
    },
    staff_type: {
      type: String,
      enum: ['housekeeping'],
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
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    room_type: {
      type: String,
      trim: true,
      default: '',
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
    work_date: {
      type: Date,
      default: null,
    },
    start_time: {
      type: String,
      trim: true,
      default: '',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must use HH:mm format'],
    },
    end_time: {
      type: String,
      trim: true,
      default: '',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must use HH:mm format'],
    },
    duration_minutes: {
      type: Number,
      min: 1,
      max: 480,
      default: null,
    },
    task_origin: {
      type: String,
      enum: ['manager_schedule', 'checkout', 'inspection', 'maintenance', 'other'],
      default: 'other',
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
    completion_note: {
      type: String,
      trim: true,
      maxlength: [1000, 'Completion note cannot exceed 1000 characters'],
      default: '',
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
staffTaskSchema.index({ assigned_staff_id: 1, work_date: 1 });
staffTaskSchema.index({ room_number: 1, work_date: 1 });
staffTaskSchema.index({ booking_id: 1, cleaningType: 1 });

module.exports = mongoose.model('StaffTask', staffTaskSchema);
