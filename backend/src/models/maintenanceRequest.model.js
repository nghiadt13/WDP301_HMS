const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'Equipment Failure',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'high',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Open', 'InProgress', 'Resolved', 'Cancelled'],
      default: 'Open',
    },
    assignedTech: {
      type: String,
      trim: true,
      default: 'Technical Team',
    },
    reportedBy: {
      type: String,
      trim: true,
      default: 'Housekeeping',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'maintenance_requests',
  }
);

maintenanceRequestSchema.index({ room: 1, status: 1 });

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
