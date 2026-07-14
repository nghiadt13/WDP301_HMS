const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    login_account: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true
    },
    password_hash: {
      type: String,
      required: true
    },
    full_name: {
      type: String,
      required: true,
      trim: true
    },
    phone_number: {
      type: String,
      trim: true,
      default: ''
    },
    id_card_number: {
      type: String,
      trim: true,
      default: ''
    },
    passport_number: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    avatar: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'locked'],
      default: 'active'
    },
    auth_provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    auth_providers: {
      type: [
        {
          type: String,
          enum: ['local', 'google']
        }
      ],
      default: ['local']
    },
    google_id: {
      type: String,
      trim: true,
      default: undefined
    },
    email_verified: {
      type: Boolean,
      default: false
    },
    hotel_name: {
      type: String,
      trim: true,
      default: ''
    },
    accepted_terms_at: {
      type: Date,
      default: null
    },
    password_reset_token_hash: {
      type: String,
      default: ''
    },
    password_reset_expires_at: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

userSchema.methods.toSafeObject = function toSafeObject(role) {
  return {
    id: this._id,
    email: this.email,
    login_account: this.login_account,
    full_name: this.full_name,
    phone_number: this.phone_number,
    id_card_number: this.id_card_number,
    passport_number: this.passport_number,
    address: this.address,
    avatar: this.avatar,
    status: this.status,
    auth_provider: this.auth_provider,
    auth_providers: this.auth_providers || [this.auth_provider || 'local'],
    email_verified: this.email_verified,
    hotel_name: this.hotel_name,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    role: role
      ? {
          id: role._id,
          name: role.name,
          permission_sets: role.permission_sets || []
        }
      : null
  };
};

userSchema.index(
  { google_id: 1 },
  {
    unique: true,
    partialFilterExpression: {
      google_id: { $type: 'string' }
    }
  }
);

module.exports = mongoose.model('User', userSchema);
