const express = require('express');
const router = express.Router();

const checkoutController = require('./checkout.controller');
const checkoutValidator = require('./checkout.validator');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

// Protect all receptionist checkout routes
router.use(authMiddleware);
router.use(authorize('receptionist', 'admin', 'manager'));

// Get summary for check-out
router.get('/:bookingId/summary', checkoutController.getCheckoutSummary);

// Inspection routes
router.post('/:bookingId/inspection', checkoutValidator.createInspection, checkoutController.createInspectionRequest);
router.get('/:bookingId/inspection', checkoutController.getInspectionResults);

// Charges routes
router.post('/:bookingId/charges', checkoutValidator.addCharge, checkoutController.addCharge);
router.delete('/:bookingId/charges/:chargeId', checkoutController.removeCharge);

// Invoice routes
router.post('/:bookingId/invoice', checkoutController.generateInvoice);

// Complete Check-out
router.post('/:bookingId/complete', checkoutValidator.completeCheckout, checkoutController.completeCheckout);

module.exports = router;
