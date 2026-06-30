const express = require('express');

const managerRoutes = require('./manager.route');

const router = express.Router();

router.get('/health', (req, res) => {
  res.send({
    status: 'ok',
    service: 'wdp101-api'
  });
});

router.use('/manager', managerRoutes);

module.exports = router;
