const ROOM_DISPLAY_ORDER = [
  'PHONG DELUXE',
  'PHONG PREMIUM',
  'PHONG CLUB DELUXE TWIN',
  'PHONG CLUB PADDINGTON DELUXE',
  'PHONG GRAND SUITE',
  'PHONG PRESIDENT SUITE',
];

const ROOM_NAME_MAP = {
  'PHONG DELUXE': 'Phòng Deluxe Tiêu Chuẩn',
  'PHONG PREMIUM': 'Phòng Premium Cao Cấp',
  'PHONG CLUB DELUXE TWIN': 'Phòng Club Deluxe 2 Giường',
  'PHONG CLUB PADDINGTON DELUXE': 'Phòng Club Deluxe Paddington',
  'PHONG GRAND SUITE': 'Phòng Grand Suite VIP',
  'PHONG PRESIDENT SUITE': 'Phòng Tổng Thống President',
  'PHÒNG DELUXE': 'Phòng Deluxe Tiêu Chuẩn',
  'PHÒNG PREMIUM': 'Phòng Premium Cao Cấp',
  'PHÒNG CLUB DELUXE TWIN': 'Phòng Club Deluxe 2 Giường',
  'PHÒNG CLUB PADDINGTON DELUXE': 'Phòng Club Deluxe Paddington',
  'PHÒNG GRAND SUITE': 'Phòng Grand Suite VIP',
  'PHÒNG PRESIDENT SUITE': 'Phòng Tổng Thống President',
};

/**
 * Normalize room name for display (PHONG → PHÒNG and add full diacritics).
 * @param {string} roomName
 * @returns {string}
 */
const normalizeRoomName = (roomName = '') => {
  const trimmed = String(roomName || '').trim();
  const upper = trimmed.toUpperCase();
  if (ROOM_NAME_MAP[upper]) {
    return ROOM_NAME_MAP[upper];
  }
  return trimmed.replace(/^PHONG\b/i, 'Phòng');
};

/**
 * Get sort order index for a room name.
 * @param {string} roomName
 * @returns {number}
 */
const getRoomOrder = (roomName) => {
  const index = ROOM_DISPLAY_ORDER.indexOf(roomName);
  return index === -1 ? ROOM_DISPLAY_ORDER.length : index;
};

/**
 * Get room quantity from a reservation object.
 * @param {object} reservation
 * @returns {number}
 */
const getRoomQuantity = (reservation) =>
  Math.max(1, Number(reservation.room_quantity || reservation.room_count || reservation.rooms_count || 1));

module.exports = {
  normalizeRoomName,
  getRoomOrder,
  getRoomQuantity,
  ROOM_DISPLAY_ORDER,
};
