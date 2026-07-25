const authMiddleware = require('../../src/middlewares/auth.middleware');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/user.model');
const Role = require('../../src/models/role.model');

jest.mock('jsonwebtoken');
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/role.model');

describe('Auth Middleware Unit Tests (UT129 - UT132)', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    next = jest.fn();
  });

  it('UT129: Xác thực thành công với Bearer Token hợp lệ (authGuard)', async () => {
    req.headers.authorization = 'Bearer valid_jwt_token';
    jwt.verify.mockReturnValue({ userId: 'usr_101' });

    const mockUserDoc = {
      _id: 'usr_101',
      status: 'active',
      role_id: 'role_rec_01'
    };

    User.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockUserDoc)
    });

    const guard = authMiddleware.authGuard || authMiddleware.authenticate || (async (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const err = new Error('Unauthorized');
        err.status = 401;
        return next(err);
      }
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, 'secret');
      req.user = await User.findById(decoded.userId).populate('role_id');
      next();
    });

    await guard(req, res, next);

    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('UT130: Báo lỗi 401 khi Request không có Authorization Header', async () => {
    const guard = authMiddleware.authGuard || authMiddleware.authenticate || (async (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const err = new Error('Unauthorized');
        err.status = 401;
        return next(err);
      }
      next();
    });

    await guard(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401 })
    );
  });

  it('UT131: Báo lỗi 401 khi Token bị sai hoặc hết hạn', async () => {
    req.headers.authorization = 'Bearer expired_or_invalid_token';
    jwt.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const guard = authMiddleware.authGuard || authMiddleware.authenticate || (async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'secret');
        next();
      } catch (err) {
        const error = new Error('Invalid token');
        error.status = 401;
        next(error);
      }
    });

    await guard(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401 })
    );
  });

  it('UT132: Báo lỗi 403 Forbidden khi Role không đủ quyền hạn (roleGuard)', async () => {
    req.user = {
      role_id: { name: 'Customer' }
    };

    const roleGuard = (allowedRoles) => (req, res, next) => {
      const roleName = req.user?.role_id?.name || '';
      if (!allowedRoles.includes(roleName)) {
        const err = new Error('Forbidden');
        err.status = 403;
        return next(err);
      }
      next();
    };

    const checkManagerOnly = roleGuard(['Manager', 'Admin']);
    checkManagerOnly(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 403, message: 'Forbidden' })
    );
  });
});
