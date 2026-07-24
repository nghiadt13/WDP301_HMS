const express = require('express');
const policyController = require('../modules/manager/policy/policy.controller');

const router = express.Router();

router.get('/', policyController.listPublicPolicies);

module.exports = router;
