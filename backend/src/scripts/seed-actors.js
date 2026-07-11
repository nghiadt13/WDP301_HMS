require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Role = require('../models/role.model');
const User = require('../models/user.model');

const seedActors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const actors = [
      {
        roleName: 'Admin',
        permissions: ['admin:all'],
        login_account: 'admin',
        full_name: 'System Admin',
        email: 'admin@hotelify.com'
      },
      {
        roleName: 'Manager',
        permissions: ['manager:all'],
        login_account: 'manager',
        full_name: 'Hotel Manager',
        email: 'manager@hotelify.com'
      },
      {
        roleName: 'Receptionist',
        permissions: ['receptionist:all'],
        login_account: 'receptionist',
        full_name: 'Front Desk Receptionist',
        email: 'receptionist@hotelify.com'
      },
      {
        roleName: 'Customer',
        permissions: ['customer:all'],
        login_account: 'customer',
        full_name: 'Valued Customer',
        email: 'customer@hotelify.com'
      }
    ];

    const passwordHash = await bcrypt.hash('123456', 10);

    for (const actor of actors) {
      // 1. Ensure Role exists
      let role = await Role.findOne({ name: { $regex: new RegExp(`^${actor.roleName}$`, 'i') } });
      if (!role) {
        role = await Role.create({
          name: actor.roleName,
          permission_sets: actor.permissions,
          is_active: true
        });
        console.log(`Created role: ${actor.roleName}`);
      }

      // 2. Ensure User exists and update password
      let user = await User.findOne({ login_account: actor.login_account });
      if (user) {
        user.password_hash = passwordHash;
        await user.save();
        console.log(`Updated existing user password: ${actor.login_account} / 123456`);
      } else {
        await User.create({
          role_id: role._id,
          email: actor.email,
          login_account: actor.login_account,
          password_hash: passwordHash,
          full_name: actor.full_name,
          status: 'active',
          auth_provider: 'local',
          email_verified: true,
          accepted_terms_at: new Date()
        });
        console.log(`Created new user: ${actor.login_account} / 123456`);
      }
    }

    console.log('All actors seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed actors failed:', err);
    process.exit(1);
  }
};

seedActors();
