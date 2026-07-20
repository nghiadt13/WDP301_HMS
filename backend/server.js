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
  const preferredPort = Number(PORT);
  const server = app.listen(preferredPort, () => {
    console.log(`Server running on port ${preferredPort}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const fallbackPort = preferredPort + 1;
      console.warn(`Port ${preferredPort} is in use. Retrying on port ${fallbackPort}...`);
      app.listen(fallbackPort, () => {
        console.log(`Server running on port ${fallbackPort}`);
      });
      return;
    }

    console.error('Server failed to start:', error);
    process.exit(1);
  });
});
