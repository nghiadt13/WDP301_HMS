const mongoose = require('mongoose');

const validateRoom = (req, res, next) => {
  const { roomName, room_type_id } = req.body;
  const errors = [];

  if (!roomName || typeof roomName !== 'string' || roomName.trim().length === 0) {
    errors.push('roomName is required');
  }

  if (!room_type_id || !mongoose.Types.ObjectId.isValid(room_type_id)) {
    errors.push('room_type_id is required and must be a valid ID');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  next();
};

module.exports = { validateRoom };
