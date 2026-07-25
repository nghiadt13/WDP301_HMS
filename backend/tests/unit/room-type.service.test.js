const roomTypeService = require('../../src/modules/manager/room-type/room-type.service');
const RoomType = require('../../src/models/room-type.model');

jest.mock('../../src/models/room-type.model');

describe('Room Type Service Unit Tests (UT033 - UT040)', () => {
  let mockRoomType;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRoomType = {
      _id: 'rt_101',
      name: 'Deluxe Ocean View',
      capacity: 2,
      base_price: 2000000,
      display_order: 1,
      is_active: true
    };
  });

  it('UT033: Lấy danh sách loại phòng', async () => {
    RoomType.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([mockRoomType])
    });

    const result = await roomTypeService.getAll();

    expect(RoomType.find).toHaveBeenCalledWith({ is_active: { $ne: false } });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Deluxe Ocean View');
  });

  it('UT034: Tạo loại phòng mới thành công', async () => {
    RoomType.findOne.mockResolvedValue(null);
    RoomType.countDocuments.mockResolvedValue(0);
    RoomType.create.mockResolvedValue(mockRoomType);

    const data = { name: 'Deluxe Ocean View', capacity: 2, base_price: 2000000 };
    const result = await roomTypeService.create(data);

    expect(RoomType.findOne).toHaveBeenCalledWith({ name: 'Deluxe Ocean View', is_active: { $ne: false } });
    expect(RoomType.create).toHaveBeenCalled();
    expect(result.name).toBe('Deluxe Ocean View');
  });

  it('UT035: Tạo loại phòng trùng tên (ném lỗi 409)', async () => {
    RoomType.findOne.mockResolvedValue(mockRoomType);

    const data = { name: 'Deluxe Ocean View' };
    await expect(roomTypeService.create(data)).rejects.toEqual({
      status: 409,
      message: 'Room type name already exists'
    });
  });

  it('UT036: Lấy loại phòng theo ID thành công', async () => {
    RoomType.findById.mockResolvedValue(mockRoomType);

    const result = await roomTypeService.getById('rt_101');

    expect(RoomType.findById).toHaveBeenCalledWith('rt_101');
    expect(result._id).toBe('rt_101');
  });

  it('UT037: Cập nhật loại phòng thành công', async () => {
    const updated = { ...mockRoomType, name: 'Deluxe City View' };
    RoomType.findByIdAndUpdate.mockResolvedValue(updated);

    const result = await roomTypeService.update('rt_101', { name: 'Deluxe City View' });

    expect(RoomType.findByIdAndUpdate).toHaveBeenCalledWith(
      'rt_101',
      { name: 'Deluxe City View' },
      { new: true, runValidators: true }
    );
    expect(result.name).toBe('Deluxe City View');
  });

  it('UT038: Cập nhật loại phòng không tồn tại (ném lỗi 404)', async () => {
    RoomType.findByIdAndUpdate.mockResolvedValue(null);

    await expect(roomTypeService.update('invalid_id', { name: 'Test' })).rejects.toEqual({
      status: 404,
      message: 'Room type not found'
    });
  });

  it('UT039: Xóa mềm loại phòng thành công', async () => {
    const deactivated = { ...mockRoomType, is_active: false };
    RoomType.findByIdAndUpdate.mockResolvedValue(deactivated);

    const result = await roomTypeService.remove('rt_101');

    expect(RoomType.findByIdAndUpdate).toHaveBeenCalledWith(
      'rt_101',
      { is_active: false },
      { new: true }
    );
    expect(result.is_active).toBe(false);
  });

  it('UT040: Xóa loại phòng không tồn tại (ném lỗi 404)', async () => {
    RoomType.findByIdAndUpdate.mockResolvedValue(null);

    await expect(roomTypeService.remove('invalid_id')).rejects.toEqual({
      status: 404,
      message: 'Room type not found'
    });
  });
});
