const roleService = require('../../src/modules/admin/role/role.service');
const Role = require('../../src/models/role.model');

jest.mock('../../src/models/role.model');

describe('Admin Role Service Unit Tests (UT085 - UT088)', () => {
  let mockRoleDoc;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRoleDoc = {
      _id: 'role_rec_01',
      name: 'Receptionist',
      description: 'Lễ tân khách sạn',
      permission_sets: ['CHECKIN', 'CHECKOUT'],
      is_active: true,
      save: jest.fn().mockResolvedValue(true)
    };
  });

  it('UT085: Admin lấy danh sách các Role (getAllRoles)', async () => {
    Role.find.mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockRoleDoc])
        })
      })
    });
    Role.countDocuments.mockResolvedValue(1);

    const result = await roleService.getAllRoles({});

    expect(Role.find).toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Receptionist');
  });

  it('UT086: Admin tạo Role mới thành công (createRole)', async () => {
    Role.findOne.mockResolvedValue(null);
    Role.create.mockResolvedValue(mockRoleDoc);

    const payload = {
      name: 'Receptionist',
      description: 'Lễ tân khách sạn',
      permission_sets: ['CHECKIN', 'CHECKOUT']
    };

    const created = await roleService.createRole(payload);

    expect(Role.create).toHaveBeenCalled();
    expect(created.name).toBe('Receptionist');
  });

  it('UT087: Admin tạo Role bị trùng tên (ném lỗi 400)', async () => {
    Role.findOne.mockResolvedValue(mockRoleDoc);

    const payload = { name: 'Receptionist' };

    await expect(roleService.createRole(payload)).rejects.toHaveProperty(
      'message',
      'Role name already exists'
    );
  });

  it('UT088: Admin cập nhật thông tin và danh sách quyền của Role (updateRole)', async () => {
    Role.findById.mockResolvedValue(mockRoleDoc);

    const updatePayload = {
      description: 'Cập nhật mô tả lễ tân',
      permission_sets: ['CHECKIN', 'CHECKOUT', 'ROOM_INSPECT']
    };

    const updated = await roleService.updateRole('role_rec_01', updatePayload);

    expect(mockRoleDoc.save).toHaveBeenCalled();
    expect(updated.description).toBe('Cập nhật mô tả lễ tân');
  });
});
