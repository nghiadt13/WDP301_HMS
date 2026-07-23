const mongoose = require('mongoose');

const validateWalkIn = (req, res, next) => {
  const { roomTypeId, roomCount, checkInDate, checkOutDate } = req.body;
  const errors = [];

  if (!roomTypeId || !mongoose.Types.ObjectId.isValid(roomTypeId)) {
    errors.push('roomTypeId is required and must be a valid ID');
  }

  if (!roomCount || typeof roomCount !== 'number' || roomCount < 1) {
    errors.push('roomCount is required and must be at least 1');
  }

  if (!checkInDate || isNaN(Date.parse(checkInDate))) {
    errors.push('checkInDate is required and must be a valid date');
  }

  if (!checkOutDate || isNaN(Date.parse(checkOutDate))) {
    errors.push('checkOutDate is required and must be a valid date');
  }

  if (checkInDate && checkOutDate && Date.parse(checkOutDate) <= Date.parse(checkInDate)) {
    errors.push('checkOutDate must be after checkInDate');
  }

  if (req.body.paymentMethod && !['Cash', 'BankTransfer'].includes(req.body.paymentMethod)) {
    errors.push('paymentMethod must be either Cash or BankTransfer');
  }

  if (req.body.selectedRoomIds !== undefined && !Array.isArray(req.body.selectedRoomIds)) {
    errors.push('selectedRoomIds must be an array');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  next();
};

const validateCheckIn = (req, res, next) => {
  const { stayGuests, roomAssignments } = req.body;
  const errors = [];

  if (!Array.isArray(stayGuests) || stayGuests.length === 0) {
    errors.push('stayGuests must be a non-empty array');
  } else {
    stayGuests.forEach((guest, index) => {
      if (!guest.bookingRoomId || !mongoose.Types.ObjectId.isValid(guest.bookingRoomId)) {
        errors.push(`stayGuests[${index}].bookingRoomId is required and must be a valid ID`);
      }
      if (!guest.fullName || typeof guest.fullName !== 'string' || guest.fullName.trim().length === 0) {
        errors.push(`stayGuests[${index}].fullName is required`);
      }
      const isCccd = guest.documentType === 'ID_CARD' || !guest.documentType;
      if (isCccd) {
        if (!guest.idCardNumber || typeof guest.idCardNumber !== 'string' || !/^\d{12}$/.test(guest.idCardNumber.trim())) {
          errors.push(`stayGuests[${index}].idCardNumber is required and must be exactly 12 digits`);
        }
      } else {
        if (!guest.passportNumber || typeof guest.passportNumber !== 'string' || guest.passportNumber.trim().length === 0) {
          errors.push(`stayGuests[${index}].passportNumber is required for PASSPORT`);
        }
      }
    });
  }

  if (!Array.isArray(roomAssignments) || roomAssignments.length === 0) {
    errors.push('roomAssignments must be a non-empty array');
  } else {
    roomAssignments.forEach((assignment, index) => {
      if (!assignment.bookingRoomId || !mongoose.Types.ObjectId.isValid(assignment.bookingRoomId)) {
        errors.push(`roomAssignments[${index}].bookingRoomId is required and must be a valid ID`);
      }
      if (!assignment.roomId || !mongoose.Types.ObjectId.isValid(assignment.roomId)) {
        errors.push(`roomAssignments[${index}].roomId is required and must be a valid ID`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  next();
};

module.exports = {
  validateWalkIn,
  validateCheckIn
};
