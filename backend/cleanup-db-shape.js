const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '.env') });

const roomTypePollutionFields = {
  capacity: '',
  bed_type: '',
  base_price: '',
  amenities: '',
  images: '',
  description: '',
  is_active: '',
  slug: '',
  _seedTag: '',
  created_at: '',
  updated_at: ''
};

const roomPollutionFields = {
  source: '',
  slug: '',
  imageUrl: '',
  image_url: '',
  alt: '',
  area: '',
  maxGuests: '',
  max_guests: '',
  guestLabel: '',
  guest_label: '',
  bedLabel: '',
  bed_label: '',
  sort_order: '',
  is_active: '',
  _seedTag: '',
  created_at: '',
  updated_at: ''
};

async function dropIfExists(db, collectionName) {
  const exists = await db.listCollections({ name: collectionName }).hasNext();

  if (!exists) {
    return false;
  }

  await db.collection(collectionName).drop();
  return true;
}

async function cleanupDbShape() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Please add it to backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((collection) => collection.name).sort();
  console.log('Read collections before cleanup:', collectionNames.join(', '));

  const roomBefore = await db.collection('rooms').findOne();
  const roomTypesBefore = await db.collection('room_types').findOne();
  console.log('rooms sample keys before cleanup:', roomBefore ? Object.keys(roomBefore).join(', ') : 'none');
  console.log(
    'room_types sample keys before cleanup:',
    roomTypesBefore ? Object.keys(roomTypesBefore).join(', ') : 'none'
  );

  const droppedRoom = await dropIfExists(db, 'room');
  const droppedHomeContents = await dropIfExists(db, 'home_contents');

  const roomTypesCleanup = await db.collection('room_types').updateMany({}, { $unset: roomTypePollutionFields });

  const roomHomepageDocsCleanup = await db.collection('rooms').deleteMany({
    source: { $in: ['home_hero_banner', 'home_lobby_gallery', 'home_lobby_copy', 'home_room_intro'] }
  });

  const roomFieldCleanup = await db
    .collection('rooms')
    .updateMany({ _seedTag: { $exists: true } }, { $unset: roomPollutionFields });

  const collectionsAfter = await db.listCollections().toArray();
  console.log(
    JSON.stringify(
      {
        droppedRoom,
        droppedHomeContents,
        roomTypesMatched: roomTypesCleanup.matchedCount,
        roomTypesModified: roomTypesCleanup.modifiedCount,
        homepageDocsDeletedFromRooms: roomHomepageDocsCleanup.deletedCount,
        pollutedRoomsMatched: roomFieldCleanup.matchedCount,
        pollutedRoomsModified: roomFieldCleanup.modifiedCount,
        collectionsAfter: collectionsAfter.map((collection) => collection.name).sort()
      },
      null,
      2
    )
  );
}

cleanupDbShape()
  .catch((error) => {
    console.error('DB shape cleanup failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
