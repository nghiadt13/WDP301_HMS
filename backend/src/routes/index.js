const express = require('express');
const roomRoutes = require('./room.route');
const roomTypeRoutes = require('./room-type.route');
const amenityRoutes = require('./amenity.route');
const featureRoutes = require('./feature.route');
const uploadRoutes = require('./upload.route');

const router = express.Router();

router.get('/health', (req, res) => {
  res.send({
    status: 'ok',
    service: 'wdp101-api'
  });
});

router.use('/rooms', roomRoutes);
router.use('/room-types', roomTypeRoutes);
router.use('/amenities', amenityRoutes);
router.use('/features', featureRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
