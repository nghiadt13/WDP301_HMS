const policyService = require('../../src/modules/manager/policy/policy.service');
const HotelPolicy = require('../../src/models/hotelPolicy.model');

jest.mock('../../src/models/hotelPolicy.model');

describe('Policy Service Unit Tests (UT071 - UT074)', () => {
  let mockPolicy;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPolicy = {
      _id: 'pol_101',
      title: 'Thời gian nhận phòng',
      category: 'Lưu trú',
      content: 'Nội dung quy định thời gian nhận phòng từ 14:00.',
      display_order: 1,
      is_active: true
    };

    HotelPolicy.countDocuments.mockResolvedValue(1);
  });

  it('UT071: Lấy danh sách chính sách (listPolicies)', async () => {
    HotelPolicy.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockPolicy])
      })
    });

    const result = await policyService.listPolicies();

    expect(HotelPolicy.find).toHaveBeenCalledWith({});
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Thời gian nhận phòng');
  });

  it('UT072: Tạo chính sách mới thành công (createPolicy)', async () => {
    HotelPolicy.create.mockResolvedValue(mockPolicy);

    const payload = {
      title: 'Quy định hủy phòng',
      category: 'Đặt phòng',
      content: 'Khách hàng có thể hủy trước 24h không tính phí.'
    };

    const created = await policyService.createPolicy(payload);

    expect(HotelPolicy.create).toHaveBeenCalled();
    expect(created.title).toBe('Thời gian nhận phòng');
  });

  it('UT073: Cập nhật chính sách thành công (updatePolicy)', async () => {
    const updated = { ...mockPolicy, title: 'Quy định nhận/trả phòng' };
    HotelPolicy.findByIdAndUpdate.mockResolvedValue(updated);

    const result = await policyService.updatePolicy('pol_101', {
      title: 'Quy định nhận/trả phòng',
      category: 'Lưu trú',
      content: 'Cập nhật nội dung quy định nhận trả phòng.'
    });

    expect(HotelPolicy.findByIdAndUpdate).toHaveBeenCalled();
    expect(result.title).toBe('Quy định nhận/trả phòng');
  });

  it('UT074: Xóa chính sách thành công (deletePolicy)', async () => {
    HotelPolicy.findByIdAndDelete.mockResolvedValue(mockPolicy);

    const deleted = await policyService.deletePolicy('pol_101');

    expect(HotelPolicy.findByIdAndDelete).toHaveBeenCalledWith('pol_101');
    expect(deleted._id).toBe('pol_101');
  });
});
