const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MIME_EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const sanitizeBasename = (value) => String(value || '')
  .replace(/\.[^.]+$/, '')
  .replace(/[^A-Za-z0-9_-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase()
  .slice(0, 60) || 'image';

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
    const ext = MIME_EXTENSION_MAP[file.mimetype] || path.extname(file.originalname).toLowerCase();
    const safeBase = sanitizeBasename(file.originalname);
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  },
});

// File filter: only allow images
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const extOk = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
  const fileKey = `${String(file.originalname || '').toLowerCase()}::${file.mimetype}`;

  if (!extOk || !mimeOk) {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    return;
  }

  req._seenUploadFiles = req._seenUploadFiles || new Set();
  if (req._seenUploadFiles.has(fileKey)) {
    cb(new Error('Duplicate files are not allowed in a single upload request.'));
    return;
  }

  req._seenUploadFiles.add(fileKey);
  cb(null, true);
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
      LIMIT_UNEXPECTED_FILE: 'Only image files (jpg, jpeg, png, webp) are allowed.',
      LIMIT_FILE_COUNT: 'Too many files. Maximum is 10 images.',
      LIMIT_FIELD_COUNT: 'Too many fields.',
    };
    const message = messages[err.code] || `Upload error: ${err.message}`;
    return res.status(400).json({ success: false, message });
  }
  if (err && err.message === 'Duplicate files are not allowed in a single upload request.') {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

// Verify actual binary magic bytes of the file
const isValidImageMagicBytes = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    // JPEG: FF D8 FF
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    // PNG: 89 50 4E 47
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    // WEBP: RIFF...WEBP
    const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
                   buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

    return isJpeg || isPng || isWebp;
  } catch (err) {
    return false;
  }
};

// POST /api/upload/rooms — single file upload
router.post('/rooms', upload.single('image'), handleMulterError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }

  // Verify file binary content (Magic Bytes)
  if (!isValidImageMagicBytes(req.file.path)) {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    return res.status(400).json({
      success: false,
      message: 'File không phải là định dạng ảnh hợp lệ (Phát hiện tập tin bị đổi đuôi sai định dạng).'
    });
  }

  const url = `/uploads/rooms/${req.file.filename}`;
  res.status(200).json({ success: true, data: { url } });
});

// POST /api/upload/rooms/multiple — multiple files upload
router.post('/rooms/multiple', upload.array('images', 10), handleMulterError, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No image files provided' });
  }

  // Validate magic bytes for all files
  for (const f of req.files) {
    if (!isValidImageMagicBytes(f.path)) {
      req.files.forEach((file) => { try { fs.unlinkSync(file.path); } catch (e) {} });
      return res.status(400).json({
        success: false,
        message: 'Có file tải lên không phải là ảnh hợp lệ (Phát hiện tập tin bị đổi đuôi sai định dạng).'
      });
    }
  }

  const urls = req.files.map((f) => `/uploads/rooms/${f.filename}`);
  res.status(200).json({ success: true, data: { urls } });
});

// DELETE /api/upload/rooms/:filename — delete a single uploaded file
router.delete('/rooms/:filename', (req, res) => {
  const { filename } = req.params;
  // Sanitize filename to prevent path traversal
  const safeName = path.basename(filename);
  const filePath = path.join(uploadDir, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete file' });
    }
    res.status(200).json({ success: true, message: 'File deleted successfully' });
  });
});

module.exports = router;
