/**
 * Migration: Convert rooms.features (string[]) → rooms.feature_ids (ObjectId[])
 * and remove rooms.facilities field.
 *
 * Uses raw MongoDB queries since the Mongoose schema no longer has the old fields.
 *
 * Usage: node backend/src/scripts/migrate-room-features.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Feature = require('../models/feature.model');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Build feature name → _id lookup
    const allFeatures = await Feature.find({ is_active: true });
    const featureMap = {};
    allFeatures.forEach((f) => { featureMap[f.name.toLowerCase()] = f._id; });
    console.log(`Available features: ${allFeatures.map((f) => f.name).join(', ')}`);

    // Find rooms with old `features` field using raw query
    const rooms = await db.collection('rooms').find({ features: { $exists: true, $ne: [] } }).toArray();
    console.log(`Found ${rooms.length} rooms with legacy features data`);

    let migrated = 0;
    for (const room of rooms) {
      const featureIds = [];
      for (const name of room.features) {
        const id = featureMap[name.toLowerCase()];
        if (id) {
          featureIds.push(id);
        } else {
          console.log(`  Warning: feature "${name}" not found, skipping for ${room.roomName}`);
        }
      }

      await db.collection('rooms').updateOne(
        { _id: room._id },
        {
          $set: { feature_ids: featureIds },
          $unset: { features: '', facilities: '' },
        }
      );
      migrated++;
    }

    // Also clean up any remaining facilities fields
    const cleanupResult = await db.collection('rooms').updateMany(
      { facilities: { $exists: true } },
      { $unset: { facilities: '' } }
    );
    if (cleanupResult.modifiedCount > 0) {
      console.log(`Cleaned up facilities field from ${cleanupResult.modifiedCount} rooms`);
    }

    console.log(`Migrated ${migrated} rooms`);
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();
