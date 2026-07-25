const bcrypt = require('bcryptjs');
const crypto = require('crypto');

jest.mock('../../src/utils/async-handler', () => (fn) => fn);
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/role.model');
jest.mock('../../src/models/security-log.model');
jest.mock('../../src/utils/mail.utils');
jest.mock('../../src/utils/token', () => ({
  signAuthToken: jest.fn(() => 'mocked-jwt-token')
}));

const authService = require('../../src/services/auth.service');
const User = require('../../src/models/user.model');
const Role = require('../../src/models/role.model');
const SecurityLog = require('../../src/models/security-log.model');
const { sendPasswordResetEmail } = require('../../src/utils/mail.utils');

describe('Auth Service - Customer Login & Register Unit Tests', () => {
  let req, res, next, mockCustomerRole, mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      headers: { 'user-agent': 'Jest-Test-Agent' },
      ip: '127.0.0.1'
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    mockCustomerRole = {
      _id: 'role_customer_id',
      name: 'Customer',
      permission_sets: ['room:view'],
      is_active: true
    };

    mockUser = {
      _id: 'user_123',
      login_account: 'testuser',
      email: 'test@example.com',
      password_hash: '$2a$10$mockedhash',
      status: 'active',
      auth_provider: 'local',
      auth_providers: ['local'],
      role_id: mockCustomerRole,
      save: jest.fn().mockResolvedValue(true),
      toSafeObject: jest.fn().mockReturnValue({ id: 'user_123', email: 'test@example.com' })
    };

    Role.findOne.mockResolvedValue(mockCustomerRole);
    SecurityLog.create.mockResolvedValue({});
  });

  describe('Register Feature', () => {
    it('UT001: Register - Đăng ký tài khoản mới thành công', async () => {
      req.body = {
        full_name: 'Nguyen Van A',
        email: 'customer@example.com',
        login_account: 'customer123',
        password: 'Password123!',
        confirm_password: 'Password123!',
        accepted_terms: true
      };

      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });
      User.create.mockResolvedValue(mockUser);

      await authService.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Account created successfully',
          token: 'mocked-jwt-token'
        })
      );
    });

    it('UT002: Register - Thiếu full_name', async () => {
      req.body = {
        email: 'customer@example.com',
        login_account: 'customer123',
        password: 'Password123!',
        accepted_terms: true
      };

      await authService.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Full name is required' });
    });

    it('UT003: Register - Email không hợp lệ', async () => {
      req.body = {
        full_name: 'Nguyen Van A',
        email: 'invalid-email',
        login_account: 'customer123',
        password: 'Password123!',
        accepted_terms: true
      };

      await authService.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'A valid email address is required' });
    });

    it('UT004: Register - login_account ngắn hơn 4 ký tự', async () => {
      req.body = {
        full_name: 'Nguyen Van A',
        email: 'customer@example.com',
        login_account: 'abc',
        password: 'Password123!',
        accepted_terms: true
      };

      await authService.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Login account must be 4-30 characters')
        })
      );
    });

    it('UT005: Register - Mật khẩu yếu', async () => {
      req.body = {
        full_name: 'Nguyen Van A',
        email: 'customer@example.com',
        login_account: 'customer123',
        password: '123',
        accepted_terms: true
      };

      await authService.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Password does not meet security requirements'
        })
      );
    });

    it('UT006: Register - Mật khẩu xác nhận không khớp', async () => {
      req.body = {
        full_name: 'Nguyen Van A',
        email: 'customer@example.com',
        login_account: 'customer123',
        password: 'Password123!',
        confirm_password: 'Password456!',
        accepted_terms: true
      };

      await authService.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Password confirmation does not match' });
    });

    it('UT007: Register - Chưa đồng ý điều khoản', async () => {
      req.body = {
        full_name: 'Nguyen Van A',
        email: 'customer@example.com',
        login_account: 'customer123',
        password: 'Password123!',
        accepted_terms: false
      };

      await authService.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'You must agree to the terms and conditions' });
    });

    it('UT008: Register - Trùng Email hoặc Login Account', async () => {
      req.body = {
        full_name: 'Nguyen Van A',
        email: 'customer@example.com',
        login_account: 'customer123',
        password: 'Password123!',
        accepted_terms: true
      };

      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([{ email: 'customer@example.com' }])
      });

      await authService.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email address is already registered'
        })
      );
    });
  });

  describe('Login Feature', () => {
    it('UT009: Login - Đăng nhập thành công', async () => {
      req.body = {
        login_account: 'testuser',
        password: 'Password123!'
      };

      User.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      await authService.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successfully',
          token: 'mocked-jwt-token'
        })
      );
    });

    it('UT010: Login - Thiếu tài khoản hoặc mật khẩu', async () => {
      req.body = { login_account: 'testuser' };

      await authService.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: 'Login account or email and password are required' });
    });

    it('UT011: Login - Tai khoản không tồn tại', async () => {
      req.body = {
        login_account: 'nonexistent',
        password: 'Password123!'
      };

      User.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await authService.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('UT012: Login - Sai mật khẩu', async () => {
      req.body = {
        login_account: 'testuser',
        password: 'WrongPassword123!'
      };

      User.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await authService.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('UT013: Login - Tài khoản bị khóa (inactive)', async () => {
      req.body = {
        login_account: 'testuser',
        password: 'Password123!'
      };

      const inactiveUser = { ...mockUser, status: 'inactive' };
      User.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(inactiveUser)
      });

      await authService.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({ message: 'This account is not active' });
    });
  });

  describe('Password Reset Feature', () => {
    it('UT014: Request Reset Password - Thành công', async () => {
      req.body = { identifier: 'test@example.com' };

      User.findOne.mockResolvedValue(mockUser);
      sendPasswordResetEmail.mockResolvedValue(true);

      await authService.requestPasswordReset(req, res, next);

      expect(res.send).toHaveBeenCalledWith({
        message: 'Password reset email has been sent. Please check your inbox.'
      });
    });

    it('UT015: Request Reset Password - Email không tồn tại', async () => {
      req.body = { identifier: 'nonexistent@example.com' };

      User.findOne.mockResolvedValue(null);

      await authService.requestPasswordReset(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        message: 'No account found with this email or login account'
      });
    });

    it('UT016: Reset Password - Token hết hạn hoặc không hợp lệ', async () => {
      req.body = {
        token: 'invalid_token',
        password: 'NewPassword123!'
      };

      User.findOne.mockResolvedValue(null);

      await authService.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Reset link is invalid or expired'
      });
    });

    it('UT017: Reset Password - Đổi mật khẩu mới thành công', async () => {
      req.body = {
        token: 'valid_token',
        password: 'NewPassword123!',
        confirm_password: 'NewPassword123!'
      };

      User.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new_hashed_password');

      await authService.resetPassword(req, res, next);

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({ message: 'Password reset successfully' });
    });
  });
});
