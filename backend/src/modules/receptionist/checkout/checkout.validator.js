const { createHttpError } = require('../../../utils/error.utils');

const checkoutValidator = {
  createInspection: (req, res, next) => {
    const { room_number, priority, description } = req.body;
    if (!room_number) {
      return next(createHttpError('room_number is required', 400));
    }
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return next(createHttpError('priority must be low, medium, or high', 400));
    }
    next();
  },

  addCharge: (req, res, next) => {
    const { description, amount, charge_type, room_id, room_inventory_item_id, quantity } = req.body;
    const normalizedType = charge_type || 'other';

    if (normalizedType === 'room_inventory') {
      if (!room_id) {
        return next(createHttpError('room_id is required for room inventory charge', 400));
      }
      if (!room_inventory_item_id) {
        return next(createHttpError('room_inventory_item_id is required', 400));
      }
      if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
        return next(createHttpError('quantity must be a positive integer', 400));
      }
      return next();
    }

    if (!description) {
      return next(createHttpError('description is required', 400));
    }
    if (amount === undefined || amount === null || typeof amount !== 'number' || amount < 0) {
      return next(createHttpError('amount is required and must be a non-negative number', 400));
    }
    if (charge_type && !['room_inventory', 'damage', 'service', 'other'].includes(charge_type)) {
      return next(createHttpError('invalid charge_type', 400));
    }
    next();
  },

  completeCheckout: (req, res, next) => {
    const { payment_method } = req.body;
    if (!payment_method) {
      return next(createHttpError('payment_method is required', 400));
    }
    next();
  }
};

module.exports = checkoutValidator;
