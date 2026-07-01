/**
 * Seed default features for rooms.
 *
 * Usage: node backend/src/scripts/seed-features.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Feature = require('../models/feature.model');

const defaultFeatures = [
  { name: 'City View', description: 'Room with a view of the city skyline' },
  { name: 'Sea View', description: 'Room with a view of the ocean' },
  { name: 'Garden View', description: 'Room overlooking the garden area' },
  { name: 'Balcony', description: 'Private balcony attached to the room' },
  { name: 'Kitchenette', description: 'Small kitchen area with basic appliances' },
  { name: 'Living Area', description: 'Separate living space within the room' },
  { name: 'Work Desk', description: 'Dedicated workspace with desk and chair' },
  { name: 'Jacuzzi', description: 'In-room jacuzzi tub' },
  { name: 'Fireplace', description: 'Electric or decorative fireplace' },
  { name: 'Connecting Rooms', description: 'Can be connected to an adjacent room' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let created = 0;
    for (const feat of defaultFeatures) {
      const existing = await Feature.findOne({ name: feat.name });
      if (!existing) {
        await Feature.create(feat);
        created++;
      }
    }

    if (created === 0) {
      console.log('All features already exist. Nothing to insert.');
    } else {
      console.log(`Inserted ${created} features`);
    }

    const total = await Feature.countDocuments({ is_active: true });
    console.log(`Total active features: ${total}`);
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
