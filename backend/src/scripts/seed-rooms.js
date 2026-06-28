/**
 * Seed 25 rooms: 5 floors × 5 rooms each.
 * Naming convention: R{floor}{room} e.g. R101 = floor 1, room 01.
 *
 * Usage: node backend/src/scripts/seed-rooms.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Room = require('../models/room.model');
const RoomType = require('../models/room-type.model');
const Feature = require('../models/feature.model');

const FLOORS = 5;
const ROOMS_PER_FLOOR = 5;

const descriptions = [
  'Spacious room with city view and modern amenities.',
  'Cozy room featuring warm lighting and elegant decor.',
  'Bright corner room with panoramic windows.',
  'Quiet room overlooking the garden area.',
  'Luxurious suite-style room with premium finishes.',
];

// Feature names to assign per room (indices into features collection)
const featureAssignments = [
  ['City View', 'Balcony', 'Work Desk'],
  ['Sea View', 'Living Area', 'Jacuzzi'],
  ['Garden View', 'Kitchenette', 'Connecting Rooms'],
  ['City View', 'Fireplace', 'Work Desk'],
  ['Sea View', 'Balcony', 'Living Area'],
];

const imageSets = [
  ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80'],
  ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80'],
  ['https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=600&q=80'],
  ['https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=600&q=80'],
  ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80'],
];

// Default room types to create if none exist
const defaultRoomTypes = [
  { name: 'Standard', description: 'Standard room with essential amenities.', bed_type: 'Single', capacity: 2, base_price: 800000 },
  { name: 'Deluxe', description: 'Deluxe room with premium features and city view.', bed_type: 'Queen', capacity: 2, base_price: 1500000 },
  { name: 'Suite', description: 'Spacious suite with separate living area.', bed_type: 'King', capacity: 3, base_price: 2500000 },
  { name: 'Family', description: 'Family room with extra beds and kid-friendly decor.', bed_type: 'Twin', capacity: 4, base_price: 2000000 },
  { name: 'Executive', description: 'Executive room for business travelers with work desk.', bed_type: 'King', capacity: 2, base_price: 3000000 },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Ensure room types exist
    let roomTypes = await RoomType.find({ is_active: true });
    if (roomTypes.length === 0) {
      console.log('No room types found. Creating default room types...');
      await RoomType.insertMany(defaultRoomTypes);
      roomTypes = await RoomType.find({ is_active: true });
      console.log(`Created ${roomTypes.length} room types`);
    }
    console.log(`Room types: ${roomTypes.map((t) => t.name).join(', ')}`);

    // Build feature name → _id lookup
    const allFeatures = await Feature.find({ is_active: true });
    const featureMap = {};
    allFeatures.forEach((f) => { featureMap[f.name] = f._id; });

    const rooms = [];
    let descIdx = 0;

    for (let floor = 1; floor <= FLOORS; floor++) {
      for (let roomNum = 1; roomNum <= ROOMS_PER_FLOOR; roomNum++) {
        const roomName = `R${floor}0${roomNum}`;
        const roomType = roomTypes[(floor + roomNum) % roomTypes.length];

        // Map feature names to ObjectIds
        const names = featureAssignments[descIdx % featureAssignments.length];
        const featureIds = names.map((n) => featureMap[n]).filter(Boolean);

        rooms.push({
          roomName,
          room_type_id: roomType._id,
          description: descriptions[descIdx % descriptions.length],
          status: 'Available',
          totalRooms: 1,
          occupiedRooms: Math.random() > 0.6 ? 1 : 0,
          images: imageSets[descIdx % imageSets.length],
          feature_ids: featureIds,
          isActive: true,
        });
        descIdx++;
      }
    }

    // Insert only rooms that don't already exist
    const existingNames = (await Room.find({}, { roomName: 1 })).map((r) => r.roomName);
    const newRooms = rooms.filter((r) => !existingNames.includes(r.roomName));

    if (newRooms.length === 0) {
      console.log('All 25 rooms already exist. Nothing to insert.');
    } else {
      const result = await Room.insertMany(newRooms);
      console.log(`Inserted ${result.length} rooms`);
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
