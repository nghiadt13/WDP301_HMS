const checkoutService = require('./checkout.service');

const checkoutController = {
  getCheckoutSummary: async (req, res, next) => {
    try {
      const summary = await checkoutService.getCheckoutSummary(req.params.bookingId);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  },

  createInspectionRequest: async (req, res, next) => {
    try {
      const task = await checkoutService.createInspectionRequest(req.params.bookingId, req.body, req.user);
      res.status(201).json({ success: true, message: 'Inspection request created', data: task });
    } catch (error) {
      next(error);
    }
  },

  getInspectionResults: async (req, res, next) => {
    try {
      const tasks = await checkoutService.getInspectionResults(req.params.bookingId);
      res.status(200).json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  },

  addCharge: async (req, res, next) => {
    try {
      const charge = await checkoutService.addCharge(req.params.bookingId, req.body);
      res.status(201).json({ success: true, message: 'Charge added', data: charge });
    } catch (error) {
      next(error);
    }
  },

  removeCharge: async (req, res, next) => {
    try {
      await checkoutService.removeCharge(req.params.bookingId, req.params.chargeId);
      res.status(200).json({ success: true, message: 'Charge removed' });
    } catch (error) {
      next(error);
    }
  },

  generateInvoice: async (req, res, next) => {
    try {
      const invoice = await checkoutService.generateInvoice(req.params.bookingId);
      res.status(200).json({ success: true, message: 'Invoice generated', data: invoice });
    } catch (error) {
      next(error);
    }
  },

  completeCheckout: async (req, res, next) => {
    try {
      const result = await checkoutService.completeCheckout(req.params.bookingId, req.body.payment_method);
      res.status(200).json({ success: true, message: 'Check-out completed successfully', data: result });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = checkoutController;
