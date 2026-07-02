const express = require('express');
const { handleCassoWebhook } = require('./casso-webhook.service');

const router = express.Router();

router.post('/casso/webhook', handleCassoWebhook);

module.exports = router;
