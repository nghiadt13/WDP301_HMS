const express = require('express');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');
const policyController = require('./policy.controller');

const router = express.Router();

router.get('/policies', authMiddleware, authorize('manager'), policyController.listManagerPolicies);
router.post('/policies', authMiddleware, authorize('manager'), policyController.createPolicy);
router.put('/policies/:policyId', authMiddleware, authorize('manager'), policyController.updatePolicy);
router.delete('/policies/:policyId', authMiddleware, authorize('manager'), policyController.deletePolicy);

module.exports = router;
