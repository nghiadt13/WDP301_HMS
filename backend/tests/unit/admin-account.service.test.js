const accountService = require('../../src/modules/admin/account/account.service');
const User = require('../../src/models/user.model');
const Role = require('../../src/models/role.model');
const bcrypt = require('bcryptjs');

jest.mock('../../src/models/user.model');
jest.mock('../../src/models/role.model');
jest.mock('bcryptjs');

describe('Admin Account Service Unit Tests (UT079 - UT084)', () => {
  let mockUserDoc;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserDoc = {
      _id: 'usr_101',
      email: 'staff@hotelify.com',
      login_account: 'staff101',
      full_name: 'Staff One',
      phone_number: '0987654321',
      status: 'active',
      role_id: { _id: 'role_receptionist', name: 'Receptionist' },
      toSafeObject: jest.fn().mockReturnValue({
        id: 'usr_101',
        email: 'staff@hotelify.com',
        loginAccount: 'staff101',
        fullName: 'Staff One',
        status: 'active',
        role: 'Receptionist'
      }),
      populate: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };

    Role.findOne.mockResolvedValue({ _id: 'role_customer', name: 'Customer' });
  });

  it('UT079: Admin lấy danh sách tài khoản nội bộ (getAllAccounts)', async () => {
    User.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([mockUserDoc])
          })
        })
      })
    });
    User.countDocuments.mockResolvedValue(1);

    const result = await accountService.getAllAccounts({});

    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.items[0].email).toBe('staff@hotelify.com');
  });

  it('UT080: Admin lấy chi tiết tài khoản theo ID (getAccountById)', async () => {
    User.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockUserDoc)
    });

    const user = await accountService.getAccountById('usr_101');

    expect(User.findById).toHaveBeenCalledWith('usr_101');
    expect(user.id).toBe('usr_101');
  });

  it('UT081: Admin tạo tài khoản nhân viên mới thành công (createAccount)', async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed_password');
    User.create.mockResolvedValue(mockUserDoc);

    const payload = {
      email: 'staff@hotelify.com',
      login_account: 'staff101',
      full_name: 'Staff One',
      password: 'Password123!',
      role_id: 'role_receptionist'
    };

    const created = await accountService.createAccount(payload);

    expect(User.create).toHaveBeenCalled();
    expect(created.email).toBe('staff@hotelify.com');
  });

  it('UT082: Admin tạo tài khoản bị trùng Email hoặc login_account (ném lỗi 400)', async () => {
    User.findOne.mockResolvedValue(mockUserDoc);

    const payload = {
      email: 'staff@hotelify.com',
      login_account: 'staff101'
    };

    await expect(accountService.createAccount(payload)).rejects.toHaveProperty(
      'message',
      'Email or login account already exists'
    );
  });

  it('UT083: Admin cập nhật tài khoản thành công (updateAccount)', async () => {
    User.findById.mockResolvedValue(mockUserDoc);

    const updatePayload = { full_name: 'Staff One Updated' };
    const updated = await accountService.updateAccount('usr_101', updatePayload);

    expect(mockUserDoc.save).toHaveBeenCalled();
    expect(updated.id).toBe('usr_101');
  });

  it('UT084: Admin reset mật khẩu cho tài khoản (resetPassword)', async () => {
    User.findById.mockResolvedValue(mockUserDoc);
    bcrypt.hash.mockResolvedValue('new_hashed_password');

    const result = await accountService.resetPassword('usr_101', 'NewPassword123!');

    expect(mockUserDoc.save).toHaveBeenCalled();
    expect(result).toEqual({ message: 'Password reset successfully' });
  });
});
