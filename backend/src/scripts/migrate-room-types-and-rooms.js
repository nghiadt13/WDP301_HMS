require('dotenv').config();

const mongoose = require('mongoose');

const ROOM_TYPE_DEFINITIONS = [
  {
    legacyRoomName: 'PHONG DELUXE',
    roomPrefix: 'DLX',
    floor: 1,
    fallbackTotalRooms: 24,
    display_order: 1,
  },
  {
    legacyRoomName: 'PHONG PREMIUM',
    roomPrefix: 'PRM',
    floor: 2,
    fallbackTotalRooms: 20,
    display_order: 2,
  },
  {
    legacyRoomName: 'PHONG CLUB DELUXE TWIN',
    roomPrefix: 'CDT',
    floor: 3,
    fallbackTotalRooms: 16,
    display_order: 3,
  },
  {
    legacyRoomName: 'PHONG CLUB PADDINGTON DELUXE',
    roomPrefix: 'CPD',
    floor: 4,
    fallbackTotalRooms: 14,
    display_order: 4,
  },
  {
    legacyRoomName: 'PHONG GRAND SUITE',
    roomPrefix: 'GRS',
    floor: 5,
    fallbackTotalRooms: 6,
    display_order: 5,
  },
  {
    legacyRoomName: 'PHONG PRESIDENT SUITE',
    roomPrefix: 'PRS',
    floor: 6,
    fallbackTotalRooms: 2,
    display_order: 6,
  },
];

const parseCapacity = (features = []) => {
  const guestText = features.find((feature) => /nguoi|guest|adult/i.test(String(feature))) || '';
  const match = String(guestText).match(/\d+/);
  return match ? Number(match[0]) : 2;
};

const buildRoomNumber = (definition, index) => {
  const number = String(index + 1).padStart(2, '0');
  return `${definition.roomPrefix}${definition.floor}${number}`;
};

const main = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const roomTypesCollection = db.collection('room_types');
  const roomsCollection = db.collection('rooms');
  const reservationsCollection = db.collection('reservations');
  const now = new Date();

  const legacyNames = ROOM_TYPE_DEFINITIONS.map((definition) => definition.legacyRoomName);
  const legacyRooms = await roomsCollection
    .find({ roomName: { $in: legacyNames } })
    .toArray();
  const legacyRoomMap = new Map(legacyRooms.map((room) => [room.roomName, room]));
  const activeRoomTypeIds = [];
  let createdPhysicalRooms = 0;

  for (const definition of ROOM_TYPE_DEFINITIONS) {
    const legacyRoom = legacyRoomMap.get(definition.legacyRoomName);
    const existingRoomType = await roomTypesCollection.findOne({ name: definition.legacyRoomName });
    const roomTypeId = existingRoomType?._id || legacyRoom?._id || new mongoose.Types.ObjectId();
    const features = Array.isArray(legacyRoom?.features) ? legacyRoom.features : [];
    const totalRooms = Math.max(1, Number(legacyRoom?.totalRooms || existingRoomType?.totalRooms || definition.fallbackTotalRooms));
    const bedType = features[2] || legacyRoom?.bed_type || existingRoomType?.bed_type || '';

    activeRoomTypeIds.push(roomTypeId);

    await roomTypesCollection.updateOne(
      { _id: roomTypeId },
      {
        $set: {
          name: definition.legacyRoomName,
          description: legacyRoom?.description || existingRoomType?.description || '',
          bed_type: bedType,
          area: features[0] || existingRoomType?.area || '',
          guests: features[1] || existingRoomType?.guests || '',
          beds: bedType,
          capacity: parseCapacity(features.length > 0 ? features : existingRoomType?.features),
          base_price: Number(legacyRoom?.price || legacyRoom?.base_price || existingRoomType?.base_price || 0),
          images: Array.isArray(legacyRoom?.images) && legacyRoom.images.length > 0 ? legacyRoom.images : existingRoomType?.images || [],
          features: features.length > 0 ? features : existingRoomType?.features || [],
          facilities: Array.isArray(legacyRoom?.facilities) ? legacyRoom.facilities : existingRoomType?.facilities || [],
          display_order: definition.display_order,
          is_active: true,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    if (legacyRoom) {
      await reservationsCollection.updateMany(
        { room_id: legacyRoom._id },
        {
          $set: {
            room_type_id: roomTypeId,
            updated_at: now,
          },
          $unset: {
            room_id: '',
          },
        }
      );
    }

    for (let index = 0; index < totalRooms; index += 1) {
      const roomNumber = buildRoomNumber(definition, index);
      const result = await roomsCollection.updateOne(
        { roomName: roomNumber },
        {
          $setOnInsert: {
            roomName: roomNumber,
            room_number: roomNumber,
            room_type_id: roomTypeId,
            description: `Physical room ${roomNumber} for ${definition.legacyRoomName}`,
            status: 'Available',
            price: Number(legacyRoom?.price || legacyRoom?.base_price || 0),
            bed_type: bedType,
            images: Array.isArray(legacyRoom?.images) ? legacyRoom.images.slice(0, 1) : [],
            amenity_ids: [],
            feature_ids: [],
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        createdPhysicalRooms += 1;
      }
    }
  }

  await roomTypesCollection.updateMany(
    { _id: { $nin: activeRoomTypeIds } },
    {
      $set: {
        is_active: false,
        updatedAt: now,
      },
    }
  );

  const deleteLegacyResult = await roomsCollection.deleteMany({
    roomName: { $in: legacyNames },
    deprecated_as_room_type_snapshot: true,
  });

  const summary = {
    activeRoomTypes: await roomTypesCollection.countDocuments({ is_active: true }),
    physicalRooms: await roomsCollection.countDocuments({ isActive: { $ne: false }, deprecated_as_room_type_snapshot: { $ne: true } }),
    createdPhysicalRooms,
    deletedLegacyRoomSnapshots: deleteLegacyResult.deletedCount,
    remainingRoomTypeNamesInRooms: await roomsCollection.countDocuments({ roomName: { $in: legacyNames } }),
  };

  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
