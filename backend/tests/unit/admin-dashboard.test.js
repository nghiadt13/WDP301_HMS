const adminDashboardController = require('../../src/modules/admin/dashboard/dashboard.controller');
const SecurityLog = require('../../src/models/security-log.model');

jest.mock('../../src/models/security-log.model');

describe('Admin Dashboard Controller Unit Tests (UT089 - UT091)', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {};
    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    SecurityLog.countDocuments.mockResolvedValue(3);
  });

  it('UT089: Admin lấy thống kê cảnh báo bảo mật 24h (getDashboardStats)', async () => {
    await adminDashboardController.getDashboardStats(req, res, next);

    expect(SecurityLog.countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: expect.objectContaining({ $in: ['FAILED_LOGIN', 'UNAUTHORIZED_ACCESS', 'SYSTEM_ERROR'] })
      })
    );
    expect(res.send).toHaveBeenCalledWith({ security_alerts_24h: 3 });
  });

  it('UT090: Lấy thống kê số lượng cảnh báo đăng nhập thất bại', async () => {
    SecurityLog.countDocuments.mockResolvedValue(0);

    await adminDashboardController.getDashboardStats(req, res, next);

    expect(res.send).toHaveBeenCalledWith({ security_alerts_24h: 0 });
  });

  it('UT091: Xử lý thành công request từ Admin Guard', async () => {
    await adminDashboardController.getDashboardStats(req, res, next);

    expect(res.send).toHaveBeenCalled();
  });
});
