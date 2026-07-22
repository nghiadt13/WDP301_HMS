const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema(
  {
    room_number: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    room: {
      type: String,
      trim: true,
      default: '',
    },
    guest: {
      type: String,
      trim: true,
      default: '',
    },
    checklist: {
      type: {
        bed: { type: Boolean, default: false },
        bathroom: { type: Boolean, default: false },
        furniture: { type: Boolean, default: false },
        amenities: { type: Boolean, default: false },
        damage: { type: Boolean, default: false },
        lostItem: { type: Boolean, default: false },
        room_inventory: { type: Boolean, default: false },
        photo: { type: Boolean, default: false },
      },
      default: {},
    },
    damage: {
      type: [String],
      default: [],
    },
    lostItem: {
      type: [String],
      default: [],
    },
    room_inventory: {
      type: [
        {
          item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomInventoryItem', default: null },
          item: { type: String, trim: true, required: true },
          qty: { type: Number, default: 1 },
          price: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    room_inventory_total: {
      type: Number,
      default: 0,
    },
    photos: {
      type: [String],
      default: [],
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    inspected_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    inspector_name: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['submitted', 'completed', 'cancelled'],
      default: 'submitted',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    room_inventory_used: {
      type: Boolean,
      default: false,
    },
    invoice_items: {
      type: [
        {
          name: { type: String, trim: true, required: true },
          quantity: { type: Number, default: 1 },
          unit_price: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
          note: { type: String, trim: true, default: '' },
        },
      ],
      default: [],
    },
    missing_items: {
      type: [
        {
          name: { type: String, trim: true, required: true },
          quantity: { type: Number, default: 1 },
          note: { type: String, trim: true, default: '' },
        },
      ],
      default: [],
    },
    damaged_items: {
      type: [
        {
          name: { type: String, trim: true, required: true },
          severity: { type: String, enum: ['minor', 'major', 'critical'], default: 'minor' },
          note: { type: String, trim: true, default: '' },
        },
      ],
      default: [],
    },
    maintenance_required: {
      type: Boolean,
      default: false,
    },
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffTask',
      default: null,
    },
    room_status_before: {
      type: String,
      trim: true,
      default: '',
    },
    room_status_after: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'inspections',
  }
);

inspectionSchema.index({ room_number: 1, createdAt: -1 });

module.exports = mongoose.model('Inspection', inspectionSchema);
