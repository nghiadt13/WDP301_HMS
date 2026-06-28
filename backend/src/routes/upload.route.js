const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/rooms');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `room-${uniqueSuffix}${ext}`);
  },
});

// File filter: only allow images
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Multer error handler — returns JSON instead of crashing
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'File is too large. Maximum size is 5MB.',
      LIMIT_UNEXPECTED_FILE: 'Only image files (jpg, png, gif, webp) are allowed.',
      LIMIT_FILE_COUNT: 'Too many files. Maximum is 10 images.',
      LIMIT_FIELD_COUNT: 'Too many fields.',
    };
    const message = messages[err.code] || `Upload error: ${err.message}`;
    return res.status(400).json({ success: false, message });
  }
  next(err);
};

// POST /api/upload/rooms — single file upload
router.post('/rooms', upload.single('image'), handleMulterError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }
  const url = `/uploads/rooms/${req.file.filename}`;
  res.status(200).json({ success: true, data: { url } });
});

// POST /api/upload/rooms/multiple — multiple files upload
router.post('/rooms/multiple', upload.array('images', 10), handleMulterError, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No image files provided' });
  }
  const urls = req.files.map((f) => `/uploads/rooms/${f.filename}`);
  res.status(200).json({ success: true, data: { urls } });
});

module.exports = router;
