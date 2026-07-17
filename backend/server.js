const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

console.log("Current directory:", __dirname);
console.log("MONGO_URI:", process.env.MONGO_URI);

const connectDB = require('./src/config/db');
const apiRoutes = require('./src/routes');

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

const PORT = process.env.PORT || 9999;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
