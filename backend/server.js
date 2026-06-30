const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middlewares/errorHandler');
const apiRoutes = require('./src/routes');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
