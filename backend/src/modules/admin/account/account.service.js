const bcrypt = require('bcryptjs');
const User = require('../../../models/user.model');
const Role = require('../../../models/role.model');
const asyncHandler = require('../../../utils/async-handler');

const accountService = {
  async getAllAccounts(query) {
    const filter = {};
    if (query.keyword) {
      filter.$or = [
        { email: { $regex: query.keyword, $options: 'i' } },
        { full_name: { $regex: query.keyword, $options: 'i' } },
        { login_account: { $regex: query.keyword, $options: 'i' } }
      ];
    }
    
    // Admin only manages internal accounts (filter out Customers)
    // First, find the Customer role
    const customerRole = await Role.findOne({ name: { $regex: /^Customer$/i } });
    if (customerRole) {
      filter.role_id = { $ne: customerRole._id };
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find(filter)
        .populate('role_id', 'name permission_sets')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(filter)
    ]);

    // Map to safe object
    const safeItems = items.map(item => item.toSafeObject(item.role_id));

    return {
      items: safeItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getAccountById(id) {
    const user = await User.findById(id).populate('role_id', 'name permission_sets');
    if (!user) {
      const error = new Error('Account not found');
      error.statusCode = 404;
      throw error;
    }
    return user.toSafeObject(user.role_id);
  },

  async createAccount(data) {
    const existing = await User.findOne({
      $or: [{ email: data.email }, { login_account: data.login_account }]
    });

    if (existing) {
      const error = new Error('Email or login account already exists');
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password || 'admin@123', 10);
    
    const user = await User.create({
      role_id: data.role_id,
      email: data.email,
      login_account: data.login_account,
      password_hash: passwordHash,
      full_name: data.full_name,
      phone_number: data.phone_number || '',
      status: data.status || 'active',
      auth_provider: 'local',
      email_verified: true,
      accepted_terms_at: new Date()
    });

    await user.populate('role_id', 'name permission_sets');
    return user.toSafeObject(user.role_id);
  },

  async updateAccount(id, data) {
    const user = await User.findById(id);
    if (!user) {
      const error = new Error('Account not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.email || data.login_account) {
      const orConditions = [];
      if (data.email && data.email !== user.email) {
        orConditions.push({ email: data.email });
      }
      if (data.login_account && data.login_account !== user.login_account) {
        orConditions.push({ login_account: data.login_account });
      }

      if (orConditions.length > 0) {
        const existing = await User.findOne({ $or: orConditions });
        if (existing) {
          const error = new Error('Email or login account already exists');
          error.statusCode = 400;
          throw error;
        }
      }
    }

    if (data.email) user.email = data.email;
    if (data.login_account) user.login_account = data.login_account;
    if (data.full_name) user.full_name = data.full_name;
    if (data.phone_number !== undefined) user.phone_number = data.phone_number;
    if (data.role_id) user.role_id = data.role_id;
    if (data.status) user.status = data.status;

    await user.save();
    await user.populate('role_id', 'name permission_sets');
    return user.toSafeObject(user.role_id);
  },

  async resetPassword(id, newPassword) {
    const user = await User.findById(id);
    if (!user) {
      const error = new Error('Account not found');
      error.statusCode = 404;
      throw error;
    }

    if (!newPassword || newPassword.length < 8) {
      const error = new Error('Password must be at least 8 characters long');
      error.statusCode = 400;
      throw error;
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { message: 'Password reset successfully' };
  }
};

module.exports = accountService;
