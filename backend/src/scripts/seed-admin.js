require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Role = require('../models/role.model');
const User = require('../models/user.model');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create Admin role
    let adminRole = await Role.findOne({ name: { $regex: /^Admin$/i } });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Admin',
        permission_sets: ['admin:all'],
        is_active: true
      });
      console.log('Created role: Admin');
    }

    // Create Admin user
    const adminExists = await User.findOne({ login_account: 'admin' });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin@123', 10);
      await User.create({
        role_id: adminRole._id,
        email: 'admin@hotelify.com',
        login_account: 'admin',
        password_hash: passwordHash,
        full_name: 'System Admin',
        status: 'active',
        auth_provider: 'local',
        email_verified: true,
        accepted_terms_at: new Date()
      });
      console.log('Created admin account (admin / admin@123)');
    } else {
      console.log('Admin account already exists');
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Seed admin failed:', err);
    process.exit(1);
  }
};

seedAdmin();
