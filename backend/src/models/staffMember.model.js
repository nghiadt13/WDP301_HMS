const mongoose = require('mongoose');

const staffMemberSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['housekeeping', 'technical'],
      required: true
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffMember', staffMemberSchema);
