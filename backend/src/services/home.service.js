const mongoose = require('mongoose');

const asyncHandler = require('../utils/async-handler');
const { normalizeRoomName } = require('../utils/room.utils');

const bannerUrls = [
  'https://paddingtonbayviewhalong.com/vnt_upload/weblink/sanh_khach_san_1.jpg',
  'https://paddingtonbayviewhalong.com/vnt_upload/weblink/sanh_khach_san.jpg',
  'https://paddingtonbayviewhalong.com/vnt_upload/weblink/banner_03.jpg',
  'https://paddingtonbayviewhalong.com/vnt_upload/weblink/sanh_khach_san_5.jpg',
  'https://paddingtonbayviewhalong.com/vnt_upload/weblink/banner_02.jpg',
  'https://paddingtonbayviewhalong.com/vnt_upload/weblink/banner_04.jpg',
  'https://paddingtonbayviewhalong.com/vnt_upload/weblink/banner_05.jpg'
];

const bannerItems = bannerUrls.map((src, index) => ({
  id: `banner-${String(index + 1).padStart(2, '0')}`,
  src,
  alt: `Khu nghỉ dưỡng Vịnh Hạ Long banner ${index + 1}`
}));

const lobbyContent = {
  eyebrow: 'Khu Nghỉ Dưỡng Vịnh Hạ Long',
  title: 'Không Gian Sảnh Khách Sạn',
  description:
    'Trải nghiệm khu sảnh rộng, sáng và sang trọng với các góc tiếp khách được thiết kế cho cả nghỉ dưỡng lẫn công tác.',
  images: [
    ['lobby-1', 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/sanh_khach_san_1.jpg'],
    ['lobby-5', 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/sanh_khach_san_5.jpg'],
    ['lobby-main', 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/sanh_khach_san.jpg'],
    ['lobby-3', 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/sanh_khach_san_3.jpg']
  ].map(([id, src], index) => ({
    id,
    src,
    alt: `Sảnh Khách Sạn Vịnh Hạ Long ${index + 1}`
  }))
};

const roomIntro = {
  title: 'HỆ THỐNG PHÒNG NGHỈ',
  description:
    'Với vị trí đắc địa bên bờ Vịnh Hạ Long, Hotelify sở hữu các hạng phòng nghỉ sang trọng, tiện nghi và phù hợp với nhiều nhu cầu lưu trú.',
  image: 'https://paddingtonbayviewhalong.com/vnt_upload/weblink/banner_03.jpg',
  alt: 'Toàn cảnh phòng nghỉ Vịnh Hạ Long'
};

const mapHomeContentItem = (item) => ({
  id: item.id || item.slug || String(item._id),
  src: item.src || item.image_url || item.imageUrl || item.images?.[0] || '',
  alt: item.alt || item.title || '',
  title: item.title || '',
  subtitle: item.subtitle || '',
  description: item.description || ''
});

const displayRoomName = (roomName = '') => normalizeRoomName(roomName);

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
    guests: roomType.guests || features[1] || (roomType.capacity ? `${roomType.capacity} Khách` : ''),
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
