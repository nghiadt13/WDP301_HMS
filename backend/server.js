const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middlewares/error.handler');
const apiRoutes = require('./src/routes');

const app = express();
const clientOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://[::1]:5173',
  ...String(process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || clientOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send({ message: 'Welcome to wdp101 API!' });
});

app.use('/api', apiRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 9999;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
