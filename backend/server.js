const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middlewares/error.handler');
const apiRoutes = require('./src/routes');
const { expirePendingReservations } = require('./src/utils/reservation-status.utils');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send({ message: 'Welcome to wdp101 API!' });
});

app.use('/api', apiRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 9999;

connectDB().then(() => {
  setInterval(() => {
    expirePendingReservations(mongoose.connection.db).catch((error) => {
      console.error('Failed to expire pending payment reservations:', error);
    });
  }, 60 * 1000);

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
