const mongoose = require('mongoose');

const asyncHandler = require('../utils/asyncHandler');

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
  eyebrow: 'Paddington Bayview Ha Long',
  title: 'Không gian sảnh khách sạn',
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
    alt: `Paddington Bayview Ha Long lobby ${index + 1}`
  }))
};

const roomIntro = {
  title: 'LOẠI PHÒNG',
  description:
    'Với vị trí đắc địa bên bờ Vịnh Hạ Long, khách sạn Paddington Halong Bayview sở hữu không gian lý tưởng cùng các phòng nghỉ sang trọng, tiện nghi và phù hợp với nhiều nhu cầu lưu trú.',
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

const displayRoomName = (roomName = '') => roomName.replace(/^PHONG\b/i, 'PHÒNG');

const roomDisplayOrder = [
  'PHONG DELUXE',
  'PHONG PREMIUM',
  'PHONG CLUB DELUXE TWIN',
  'PHONG CLUB PADDINGTON DELUXE',
  'PHONG GRAND SUITE',
  'PHONG PRESIDENT SUITE'
];

const getRoomDisplayOrder = (roomName) => {
  const index = roomDisplayOrder.indexOf(roomName);
  return index === -1 ? roomDisplayOrder.length : index;
};

const mapHomeRoom = (room) => {
  const features = Array.isArray(room.features) ? room.features : [];

  return {
    id: String(room._id),
    src: room.images?.[0] || '',
    alt: displayRoomName(room.roomName),
    name: displayRoomName(room.roomName),
    area: features[0] || '',
    guests: features[1] || '',
    beds: features[2] || '',
    description: room.description || ''
  };
};

const getHomePage = asyncHandler(async (_req, res) => {
  const db = mongoose.connection.db;
  const roomsCollection = db.collection('rooms');

  const rooms = await roomsCollection
    .find({
      roomName: /^PHONG /,
      isActive: { $ne: false }
    })
    .sort({ createdAt: 1, roomName: 1 })
    .toArray();

  rooms.sort((firstRoom, secondRoom) => getRoomDisplayOrder(firstRoom.roomName) - getRoomDisplayOrder(secondRoom.roomName));

  res.send({
    banners: bannerItems.map(mapHomeContentItem),
    lobby: lobbyContent,
    roomIntro,
    rooms: rooms.map(mapHomeRoom)
  });
});

module.exports = {
  getHomePage
};
