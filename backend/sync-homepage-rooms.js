const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '.env') });

const homepageRooms = [
  {
    roomName: 'PHONG DELUXE',
    description:
      'Với diện tích 32 m², phòng Deluxe mang đến không gian riêng tư và sang trọng để khách thư giãn sau một ngày dài khám phá Vịnh Hạ Long.',
    totalRooms: 24,
    image:
      'https://paddingtonbayviewhalong.com/vnt_upload/product/05_2024/thumbs/(1200x600)_crop__z5470640929512_1a47268fd93e33949d619f8035e1cbd9.jpg',
    features: ['32 m²', '2 Người Lớn', '1 Giường đôi / 2 Giường đơn']
  },
  {
    roomName: 'PHONG PREMIUM',
    description:
      'Phòng Premium có không gian 36 m², thiết kế hiện đại và ấm áp, phù hợp cho kỳ nghỉ dưỡng sang trọng tại Hạ Long.',
    totalRooms: 20,
    image:
      'https://paddingtonbayviewhalong.com/vnt_upload/product/05_2024/thumbs/(1200x600)_crop__Deluxe_Twin.jpg',
    features: ['36 m²', '2 Người Lớn', '1 Giường đôi / 2 Giường đơn']
  },
  {
    roomName: 'PHONG CLUB DELUXE TWIN',
    description:
      'Phòng Club Deluxe Twin rộng thoáng 38 m², linh hoạt cho gia đình hoặc nhóm khách cần không gian nghỉ ngơi tiện nghi.',
    totalRooms: 16,
    image:
      'https://paddingtonbayviewhalong.com/vnt_upload/product/07_2024/thumbs/(1200x600)_crop__Club_Deluxe_Twin_1.jpg',
    features: ['38 m²', '2 Người Lớn', '1 Giường đôi / 2 Giường đơn']
  },
  {
    roomName: 'PHONG CLUB PADDINGTON DELUXE',
    description:
      'Phòng Club Paddington Deluxe có tầm nhìn rộng mở ra Vịnh Hạ Long, không gian 42 m² và tiện ích cao cấp.',
    totalRooms: 14,
    image:
      'https://paddingtonbayviewhalong.com/vnt_upload/product/05_2024/thumbs/(1200x600)_crop__z5470640929502_a6ba9784c72bb6c2440f2a476574c248_1.jpg',
    features: ['42 m²', '2 Người Lớn', '1 Giường đôi']
  },
  {
    roomName: 'PHONG GRAND SUITE',
    description:
      'Grand Suite có diện tích 90 m², phong cách trang nhã và không gian sang trọng cho trải nghiệm nghỉ dưỡng cao cấp.',
    totalRooms: 6,
    image:
      'https://paddingtonbayviewhalong.com/vnt_upload/product/05_2024/thumbs/(1200x600)_crop__z5470640957948_34f9127a687036a6f199a9cd6170d41a_1.jpg',
    features: ['90 m²', '2 Người Lớn', '1 Giường đôi']
  },
  {
    roomName: 'PHONG PRESIDENT SUITE',
    description:
      'President Suite là hạng phòng cao cấp nhất với diện tích 160 m², tầm nhìn bao quát Vịnh Hạ Long và trung tâm thành phố.',
    totalRooms: 2,
    image:
      'https://paddingtonbayviewhalong.com/vnt_upload/product/05_2024/thumbs/(1200x600)_crop__z5470640929422_b2afc03159a01b0d74e5a829b03449f2.jpg',
    features: ['160 m²', '2 Người Lớn', '1 Giường đôi']
  }
];

async function getExistingRoomTypeId(db) {
  const existingRoomTypes = await db.collection('room_types').find({}).project({ name: 1 }).toArray();
  console.log('Existing room_types:', existingRoomTypes.map((roomType) => roomType.name).join(', '));

  if (existingRoomTypes.length === 0) {
    throw new Error('Collection "room_types" has no documents. Aborting to avoid creating room_types data.');
  }

  return existingRoomTypes[0]._id;
}

async function syncHomepageRooms() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Please add it to backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((collection) => collection.name);
  console.log('Read collections before sync:', collectionNames.sort().join(', '));

  if (!collectionNames.includes('rooms')) {
    throw new Error('Collection "rooms" does not exist. Aborting to avoid creating a new collection.');
  }

  const sampleRoom = await db.collection('rooms').findOne();
  console.log('rooms sample keys:', sampleRoom ? Object.keys(sampleRoom).join(', ') : 'none');

  const fallbackRoomTypeId = await getExistingRoomTypeId(db);
  const now = new Date();

  for (const room of homepageRooms) {
    await db.collection('rooms').updateOne(
      { roomName: room.roomName },
      {
        $set: {
          roomName: room.roomName,
          room_type_id: fallbackRoomTypeId,
          description: room.description,
          status: 'Available',
          totalRooms: room.totalRooms,
          occupiedRooms: 0,
          images: [room.image],
          amenity_ids: [],
          features: room.features,
          facilities: [],
          isActive: true,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );
  }

  const syncedRooms = await db
    .collection('rooms')
    .find({ roomName: { $in: homepageRooms.map((room) => room.roomName) } })
    .project({ roomName: 1, room_type_id: 1, images: 1, features: 1, totalRooms: 1, isActive: 1 })
    .sort({ roomName: 1 })
    .toArray();

  console.log(`Synced ${syncedRooms.length} homepage room document(s) in existing rooms collection.`);
  console.log(JSON.stringify(syncedRooms, null, 2));
}

syncHomepageRooms()
  .catch((error) => {
    console.error('Homepage rooms sync failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
