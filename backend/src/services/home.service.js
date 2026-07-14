const mongoose = require('mongoose');

const asyncHandler = require('../utils/async-handler');

const bannerItems = Array.from({ length: 9 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  const imageNumber = index + 1 === 8 ? '8' : number;
  const cacheVersion = index + 1 === 8 ? '?v=2' : '';

  return {
    id: `banner-${number}`,
    src: `https://paddingtonbayviewhalong.com/vnt_upload/weblink/banner_${imageNumber}.jpg${cacheVersion}`,
    alt: `Paddington Bayview Ha Long banner ${number}`
  };
});

const lobbyContent = {
  eyebrow: '',
  title: 'Khong gian sanh khach san',
  description:
    'Trai nghiem khu sanh rong, sang va sang trong voi cac goc tiep khach duoc thiet ke cho ca nghi duong lan cong tac.',
  images: [
    ['lobby-1', 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/sanh_khach_san_1.jpg'],
    ['lobby-5', 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/sanh_khach_san_5.jpg'],
    ['lobby-main', 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/sanh_khach_san.jpg'],
    ['lobby-3', 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/sanh_khach_san_3.jpg']
  ].map(([id, src], index) => ({
    id,
    src,
    alt: `Paddington Bayview Ha Long lobby ${index + 1}`
  }))
};

const roomIntro = {
  title: 'LOAI PHONG',
  description:
    'Voi vi tri dac dia ben bo Vinh Ha Long, Hotelify so huu cac hang phong nghi sang trong, tien nghi va phu hop voi nhieu nhu cau luu tru.',
  image: 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/banner_03.jpg',
  alt: 'Paddington Bayview Ha Long room view'
};

const mapHomeContentItem = (item) => ({
  id: item.id || item.slug || String(item._id),
  src: item.src || item.image_url || item.imageUrl || item.images?.[0] || '',
  alt: item.alt || item.title || '',
  title: item.title || '',
  subtitle: item.subtitle || '',
  description: item.description || ''
});

const displayRoomName = (roomName = '') => roomName.replace(/^PHONG\b/i, 'PHONG');

const roomDisplayOrder = [
  'PHONG DELUXE',
  'PHONG PREMIUM',
  'PHONG CLUB DELUXE TWIN',
  'PHONG CLUB PADDINGTON DELUXE',
  'PHONG GRAND SUITE',
  'PHONG PRESIDENT SUITE'
];

const getRoomDisplayOrder = (roomName = '') => {
  const index = roomDisplayOrder.indexOf(String(roomName).toUpperCase());
  return index === -1 ? roomDisplayOrder.length : index;
};

const mapHomeRoom = (roomType) => {
  const features = Array.isArray(roomType.features) ? roomType.features : [];

  return {
    id: String(roomType._id),
    src: roomType.images?.[0] || roomType.image_url || '',
    alt: displayRoomName(roomType.name),
    name: displayRoomName(roomType.name),
    area: roomType.area || features[0] || '',
    guests: roomType.guests || features[1] || (roomType.capacity ? `${roomType.capacity} Guests` : ''),
    beds: roomType.beds || features[2] || roomType.bed_type || '',
    description: roomType.description || ''
  };
};

const getHomePage = asyncHandler(async (_req, res) => {
  const db = mongoose.connection.db;

  const roomTypes = await db
    .collection('room_types')
    .find({
      is_active: { $ne: false }
    })
    .sort({ display_order: 1, createdAt: 1, name: 1 })
    .toArray();

  roomTypes.sort((firstRoomType, secondRoomType) => {
    const firstOrder = Number.isFinite(firstRoomType.display_order)
      ? firstRoomType.display_order
      : getRoomDisplayOrder(firstRoomType.name);
    const secondOrder = Number.isFinite(secondRoomType.display_order)
      ? secondRoomType.display_order
      : getRoomDisplayOrder(secondRoomType.name);

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    return String(firstRoomType.name || '').localeCompare(String(secondRoomType.name || ''), 'en', {
      numeric: true,
      sensitivity: 'base'
    });
  });

  res.send({
    banners: bannerItems.map(mapHomeContentItem),
    lobby: lobbyContent,
    roomIntro,
    rooms: roomTypes.map(mapHomeRoom)
  });
});

module.exports = {
  getHomePage
};
