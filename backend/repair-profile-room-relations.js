const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '.env') });

const bookingRoomMap = {
  'BKG-TINLATOI2003-2038': 'PHONG DELUXE',
  'BKG-TINLATOI2003-1892': 'PHONG PREMIUM',
  'BKG-TINLATOI2003-1820': 'PHONG GRAND SUITE'
};

async function repairProfileRoomRelations() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Please add it to backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const user = await db.collection('users').findOne({ login_account: 'tinlatoi2003' });

  if (!user) {
    throw new Error('User tinlatoi2003 was not found.');
  }

  const bookingCodes = Object.keys(bookingRoomMap);
  const rooms = await db
    .collection('rooms')
    .find({ roomName: { $in: Object.values(bookingRoomMap) } })
    .project({ roomName: 1, images: 1, features: 1, isActive: 1 })
    .toArray();

  const roomByName = new Map(rooms.map((room) => [room.roomName, room]));
  const reservationsBefore = await db
    .collection('reservations')
    .find({ customer_id: user._id, booking_code: { $in: bookingCodes } })
    .project({ booking_code: 1, room_id: 1, room_type_id: 1 })
    .sort({ booking_code: 1 })
    .toArray();

  console.log('Read rooms before repair:', JSON.stringify(rooms, null, 2));
  console.log('Read reservations before repair:', JSON.stringify(reservationsBefore, null, 2));

  for (const [bookingCode, roomName] of Object.entries(bookingRoomMap)) {
    const room = roomByName.get(roomName);

    if (!room) {
      throw new Error(`Room ${roomName} was not found in collection rooms.`);
    }

    await db.collection('reservations').updateOne(
      {
        customer_id: user._id,
        booking_code: bookingCode
      },
      {
        $set: {
          room_id: room._id,
          updated_at: new Date()
        }
      }
    );
  }

  const reservationsAfter = await db
    .collection('reservations')
    .find({ customer_id: user._id, booking_code: { $in: bookingCodes } })
    .project({ booking_code: 1, room_id: 1, room_type_id: 1 })
    .sort({ booking_code: 1 })
    .toArray();

  console.log('Reservations after repair:', JSON.stringify(reservationsAfter, null, 2));
}

repairProfileRoomRelations()
  .catch((error) => {
    console.error('Profile room relation repair failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
