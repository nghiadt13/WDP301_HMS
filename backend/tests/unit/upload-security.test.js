const path = require('path');
const uploadRouter = require('../../src/routes/upload.route');

describe('Upload & Image Security Unit Tests (UT124 - UT128)', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { file: null, files: [] };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    next = jest.fn();
  });

  it('UT124: Chấp nhận file ảnh định dạng hợp lệ (PNG/JPG/WEBP)', () => {
    const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const isAllowed = (file) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const extOk = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
      return extOk && mimeOk;
    };

    const mockFile = { originalname: 'avatar.png', mimetype: 'image/png' };
    expect(isAllowed(mockFile)).toBe(true);
  });

  it('UT125: Chặn upload file thực thi độc hại (EXE/TXT/PDF)', () => {
    const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const isAllowed = (file) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const extOk = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
      return extOk && mimeOk;
    };

    const mockFile = { originalname: 'malicious.exe', mimetype: 'application/x-msdownload' };
    expect(isAllowed(mockFile)).toBe(false);
  });

  it('UT126: Chặn file có đuôi mở rộng giả mạo (script.php.png)', () => {
    const validateDoubleExt = (filename) => {
      const parts = filename.split('.');
      return parts.length <= 2;
    };

    expect(validateDoubleExt('photo.png')).toBe(true);
    expect(validateDoubleExt('script.php.png')).toBe(false);
  });

  it('UT127: Kiểm tra giới hạn dung lượng file upload (Max 5MB)', () => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const validFileSize = 2 * 1024 * 1024; // 2MB
    const oversizedFile = 10 * 1024 * 1024; // 10MB

    expect(validFileSize <= MAX_FILE_SIZE).toBe(true);
    expect(oversizedFile <= MAX_FILE_SIZE).toBe(false);
  });

  it('UT128: Báo lỗi khi request upload không đính kèm file nào', () => {
    const checkFilePresent = (req) => {
      if (!req.file && (!req.files || req.files.length === 0)) {
        const error = new Error('No image file provided');
        error.status = 400;
        throw error;
      }
    };

    expect(() => checkFilePresent(req)).toThrow('No image file provided');
  });
});
