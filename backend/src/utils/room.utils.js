const ROOM_DISPLAY_ORDER = [
  'PHONG DELUXE',
  'PHONG PREMIUM',
  'PHONG CLUB DELUXE TWIN',
  'PHONG CLUB PADDINGTON DELUXE',
  'PHONG GRAND SUITE',
  'PHONG PRESIDENT SUITE',
];

/**
 * Normalize room name for display (PHONG → PHÒNG).
 * @param {string} roomName
 * @returns {string}
 */
const normalizeRoomName = (roomName = '') => roomName.replace(/^PHONG\b/i, 'PHÒNG');

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
