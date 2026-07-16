const { createHttpError } = require('../../../utils/error.utils');

const checkoutValidator = {
  createInspection: (req, res, next) => {
    const { room_number, priority, description } = req.body;
    if (!room_number) {
      return next(createHttpError(400, 'room_number is required'));
    }
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return next(createHttpError(400, 'priority must be low, medium, or high'));
    }
    next();
  },

  addCharge: (req, res, next) => {
    const { description, amount, charge_type } = req.body;
    if (!description) {
      return next(createHttpError(400, 'description is required'));
    }
    if (amount === undefined || amount === null || typeof amount !== 'number' || amount < 0) {
      return next(createHttpError(400, 'amount is required and must be a non-negative number'));
    }
    if (charge_type && !['minibar', 'damage', 'service', 'other'].includes(charge_type)) {
      return next(createHttpError(400, 'invalid charge_type'));
    }
    next();
  },

  completeCheckout: (req, res, next) => {
    const { payment_method } = req.body;
    if (!payment_method) {
      return next(createHttpError(400, 'payment_method is required'));
    }
    next();
  }
};

module.exports = checkoutValidator;
