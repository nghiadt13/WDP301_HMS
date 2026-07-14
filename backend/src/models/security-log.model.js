const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema(
  {
    event_type: {
      type: String,
      required: true,
      enum: ['FAILED_LOGIN', 'SUCCESSFUL_LOGIN', 'UNAUTHORIZED_ACCESS', 'SYSTEM_ERROR'],
    },
    ip_address: {
      type: String,
    },
    target_account: {
      type: String,
    },
    details: {
      type: String,
    },
    session_id: {
      type: String,
      index: true
    },
    is_revoked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);

module.exports = SecurityLog;
