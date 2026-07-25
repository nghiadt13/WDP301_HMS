const roomInventoryService = require('../../src/modules/manager/room-inventory/room-inventory.service');
const RoomInventoryItem = require('../../src/models/roomInventoryItem.model');

jest.mock('../../src/models/roomInventoryItem.model');

describe('Room Inventory Service Unit Tests (UT059 - UT064)', () => {
  let mockItemPayload, mockItemDoc;

  beforeEach(() => {
    jest.clearAllMocks();

    mockItemPayload = {
      name: 'Khăn tắm cao cấp',
      category: 'Đồ vải',
      price: 150000,
      quantity: 50,
      image_url: '/uploads/rooms/khan_tam.jpg',
      description: 'Khăn tắm cotton 100%'
    };

    mockItemDoc = {
      _id: 'inv_101',
      ...mockItemPayload,
      stock_status: 'in_stock',
      is_active: true
    };
  });

  it('UT059: Lấy danh sách vật tư phòng (getRoomInventoryItems)', async () => {
    RoomInventoryItem.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([mockItemDoc])
    });

    const items = await roomInventoryService.getRoomInventoryItems();

    expect(RoomInventoryItem.find).toHaveBeenCalledWith({});
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Khăn tắm cao cấp');
  });

  it('UT060: Tạo vật tư phòng mới thành công (createRoomInventoryItem)', async () => {
    RoomInventoryItem.create.mockResolvedValue(mockItemDoc);

    const result = await roomInventoryService.createRoomInventoryItem(mockItemPayload);

    expect(RoomInventoryItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Khăn tắm cao cấp',
        stock_status: 'in_stock'
      })
    );
    expect(result.name).toBe('Khăn tắm cao cấp');
  });

  it('UT061: Báo lỗi khi tạo vật tư thiếu tên hoặc danh mục', async () => {
    const invalidPayload = { ...mockItemPayload, name: '' };

    await expect(roomInventoryService.createRoomInventoryItem(invalidPayload)).rejects.toEqual(
      expect.objectContaining({ message: 'Vui long nhap ten vat tu phong.' })
    );
  });

  it('UT062: Báo lỗi khi ảnh vật tư không đúng định dạng', async () => {
    const invalidImagePayload = { ...mockItemPayload, image_url: 'invalid_image_path.exe' };

    await expect(roomInventoryService.createRoomInventoryItem(invalidImagePayload)).rejects.toEqual(
      expect.objectContaining({ message: expect.stringContaining('Anh vat tu bat buoc phai duoc tai len') })
    );
  });

  it('UT063: Cập nhật vật tư phòng thành công (updateRoomInventoryItem)', async () => {
    const updatedDoc = { ...mockItemDoc, quantity: 5 };
    RoomInventoryItem.findByIdAndUpdate.mockResolvedValue(updatedDoc);

    const updatePayload = { ...mockItemPayload, quantity: 5 };
    const result = await roomInventoryService.updateRoomInventoryItem('inv_101', updatePayload);

    expect(RoomInventoryItem.findByIdAndUpdate).toHaveBeenCalled();
    expect(result.quantity).toBe(5);
  });

  it('UT064: Vô hiệu hóa vật tư (deactivateRoomInventoryItem) thành công', async () => {
    const inactiveDoc = { ...mockItemDoc, is_active: false };
    RoomInventoryItem.findByIdAndUpdate.mockResolvedValue(inactiveDoc);

    const result = await roomInventoryService.deactivateRoomInventoryItem('inv_101');

    expect(RoomInventoryItem.findByIdAndUpdate).toHaveBeenCalledWith(
      'inv_101',
      { is_active: false },
      { new: true, runValidators: true }
    );
    expect(result.is_active).toBe(false);
  });
});
