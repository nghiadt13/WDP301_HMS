const managerRoomService = require('../../src/modules/manager/room/room.service');
const Room = require('../../src/models/room.model');
const RoomType = require('../../src/models/room-type.model');
const RoomInventoryItem = require('../../src/models/roomInventoryItem.model');

jest.mock('../../src/models/room.model');
jest.mock('../../src/models/room-type.model');
jest.mock('../../src/models/roomInventoryItem.model');

describe('Room Management Service Unit Tests (UT021 - UT032)', () => {
  let mockRoomData, mockRoomTypeData, mockInventoryItems;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRoomTypeData = {
      _id: 'room_type_101',
      name: 'Deluxe Suite',
      capacity: 2,
      base_price: 1500000
    };

    mockInventoryItems = [
      { _id: 'inv_1', name: 'Towel', is_active: true },
      { _id: 'inv_2', name: 'Water Bottle', is_active: true }
    ];

    mockRoomData = {
      _id: 'room_001',
      roomName: 'PHONG 101',
      room_type_id: 'room_type_101',
      status: 'Available',
      isActive: true,
      room_inventory: [{ item_id: 'inv_1', quantity: 2 }],
      toObject: jest.fn().mockReturnValue({
        _id: 'room_001',
        roomName: 'PHONG 101',
        room_type_id: 'room_type_101',
        status: 'Available',
        isActive: true,
        room_inventory: [{ item_id: 'inv_1', quantity: 2 }]
      })
    };

    RoomInventoryItem.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockInventoryItems)
    });
  });

  describe('getAll (UT021 - UT023)', () => {
    it('UT021: Lấy danh sách phòng thành công (có phân trang & lọc isActive)', async () => {
      const mockQuery = { page: 1, limit: 10 };
      const roomsList = [mockRoomData];

      Room.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(roomsList)
        })
      });
      Room.countDocuments.mockResolvedValue(1);

      const result = await managerRoomService.getAll(mockQuery);

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      });
    });

    it('UT022: Lọc phòng theo roomTypeId', async () => {
      const mockQuery = { roomTypeId: 'room_type_101' };

      Room.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([mockRoomData])
        })
      });
      Room.countDocuments.mockResolvedValue(1);

      await managerRoomService.getAll(mockQuery);

      expect(Room.find).toHaveBeenCalledWith(
        expect.objectContaining({ room_type_id: 'room_type_101' })
      );
    });

    it('UT023: Lọc phòng theo status', async () => {
      const mockQuery = { status: 'Occupied' };

      Room.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });
      Room.countDocuments.mockResolvedValue(0);

      const result = await managerRoomService.getAll(mockQuery);

      expect(Room.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Occupied' })
      );
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getById (UT024 - UT025)', () => {
    it('UT024: Lấy chi tiết phòng theo ID thành công', async () => {
      Room.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockRoomData)
      });

      const result = await managerRoomService.getById('room_001');

      expect(Room.findById).toHaveBeenCalledWith('room_001');
      expect(result.roomName).toBe('PHONG 101');
    });

    it('UT025: Lấy phòng không tồn tại (ném lỗi 404)', async () => {
      Room.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await expect(managerRoomService.getById('nonexistent_id')).rejects.toEqual({
        status: 404,
        message: 'Room not found'
      });
    });
  });

  describe('create (UT026 - UT028)', () => {
    it('UT026: Tạo phòng mới thành công', async () => {
      const newRoomData = {
        roomName: 'PHONG 102',
        room_type_id: 'room_type_101',
        status: 'Available'
      };

      Room.findOne.mockResolvedValue(null);
      RoomType.findById.mockResolvedValue(mockRoomTypeData);
      
      const createdRoomInstance = {
        ...mockRoomData,
        populate: jest.fn().mockResolvedValue(mockRoomData)
      };
      Room.create.mockResolvedValue(createdRoomInstance);

      const result = await managerRoomService.create(newRoomData);

      expect(Room.findOne).toHaveBeenCalledWith({ roomName: 'PHONG 102' });
      expect(RoomType.findById).toHaveBeenCalledWith('room_type_101');
      expect(Room.create).toHaveBeenCalledWith(newRoomData);
      expect(result.roomName).toBe('PHONG 101');
    });

    it('UT027: Tạo phòng trùng tên (ném lỗi 409)', async () => {
      const duplicateData = {
        roomName: 'PHONG 101',
        room_type_id: 'room_type_101'
      };

      Room.findOne.mockResolvedValue(mockRoomData);

      await expect(managerRoomService.create(duplicateData)).rejects.toEqual({
        status: 409,
        message: 'Room name already exists'
      });
    });

    it('UT028: Tạo phòng với room_type_id không hợp lệ (ném lỗi 400)', async () => {
      const invalidTypeData = {
        roomName: 'PHONG 103',
        room_type_id: 'invalid_type_id'
      };

      Room.findOne.mockResolvedValue(null);
      RoomType.findById.mockResolvedValue(null);

      await expect(managerRoomService.create(invalidTypeData)).rejects.toEqual({
        status: 400,
        message: 'Invalid room type ID'
      });
    });
  });

  describe('update (UT029 - UT030)', () => {
    it('UT029: Cập nhật thông tin phòng thành công', async () => {
      const updateData = {
        roomName: 'PHONG 101 VIP',
        room_inventory: [{ item_id: 'inv_1', quantity: 5 }]
      };

      Room.findById.mockReturnValueOnce(mockRoomData); // findById first check
      Room.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockRoomData,
          roomName: 'PHONG 101 VIP',
          toObject: jest.fn().mockReturnValue({
            ...mockRoomData,
            roomName: 'PHONG 101 VIP'
          })
        })
      });

      const result = await managerRoomService.update('room_001', updateData);

      expect(Room.findByIdAndUpdate).toHaveBeenCalledWith(
        'room_001',
        expect.objectContaining({ roomName: 'PHONG 101 VIP' }),
        { new: true, runValidators: true }
      );
      expect(result.roomName).toBe('PHONG 101 VIP');
    });

    it('UT030: Cập nhật phòng không tồn tại (ném lỗi 404)', async () => {
      Room.findById.mockResolvedValue(null);

      await expect(
        managerRoomService.update('nonexistent_id', { roomName: 'New Name' })
      ).rejects.toEqual({
        status: 404,
        message: 'Room not found'
      });
    });
  });

  describe('remove (UT031 - UT032)', () => {
    it('UT031: Xóa mềm phòng (deactivate) thành công', async () => {
      const inactiveRoom = { ...mockRoomData, isActive: false };
      Room.findByIdAndUpdate.mockResolvedValue(inactiveRoom);

      const result = await managerRoomService.remove('room_001');

      expect(Room.findByIdAndUpdate).toHaveBeenCalledWith(
        'room_001',
        { isActive: false },
        { new: true }
      );
      expect(result.isActive).toBe(false);
    });

    it('UT032: Xóa mềm phòng không tồn tại (ném lỗi 404)', async () => {
      Room.findByIdAndUpdate.mockResolvedValue(null);

      await expect(managerRoomService.remove('nonexistent_id')).rejects.toEqual({
        status: 404,
        message: 'Room not found'
      });
    });
  });
});
