jest.mock('../../src/utils/async-handler', () => (fn) => fn);
jest.mock('mongoose', () => {
  const original = jest.requireActual('mongoose');
  return {
    ...original,
    connection: {
      db: {
        collection: jest.fn()
      }
    }
  };
});

const profileService = require('../../src/services/profile.service');
const mongoose = require('mongoose');

describe('Profile Service Unit Tests (UT120 - UT123)', () => {
  let req, res, next, mockChain;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        full_name: 'Nguyen Van A',
        email: 'user@example.com',
        phone_number: '0987654321',
        toSafeObject: jest.fn().mockReturnValue({
          fullName: 'Nguyen Van A',
          email: 'user@example.com'
        }),
        save: jest.fn().mockResolvedValue(true)
      },
      role: { name: 'Customer' },
      body: {}
    };

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    mockChain = {
      sort: jest.fn().mockReturnThis(),
      project: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([])
    };

    mongoose.connection.db.collection.mockReturnValue({
      find: jest.fn().mockReturnValue(mockChain),
      findOne: jest.fn().mockResolvedValue(null)
    });
  });

  it('UT120: Lấy thông tin Profile Dashboard của user (getProfileDashboard)', async () => {
    await profileService.getProfileDashboard(req, res, next);

    expect(res.send).toHaveBeenCalled();
    const sent = res.send.mock.calls[0][0];
    expect(sent.user).toHaveProperty('fullName', 'Nguyen Van A');
  });

  it('UT121: Cập nhật thông tin cá nhân Profile thành công (updateProfile)', async () => {
    req.body = {
      full_name: 'Nguyen Van B',
      phone_number: '0912345678',
      address: 'Hà Nội'
    };

    await profileService.updateProfile(req, res, next);

    expect(req.user.full_name).toBe('Nguyen Van B');
    expect(req.user.save).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Profile updated successfully.'
      })
    );
  });

  it('UT122: Báo lỗi khi cập nhật Profile thiếu full_name (400)', async () => {
    req.body = { full_name: '' };

    await expect(profileService.updateProfile(req, res, next)).rejects.toHaveProperty(
      'message',
      'Full name is required.'
    );
  });

  it('UT123: Báo lỗi khi cập nhật số điện thoại không hợp lệ (400)', async () => {
    req.body = {
      full_name: 'Nguyen Van A',
      phone_number: 'invalid-phone-number'
    };

    await expect(profileService.updateProfile(req, res, next)).rejects.toHaveProperty(
      'message',
      'Phone number is invalid.'
    );
  });
});
