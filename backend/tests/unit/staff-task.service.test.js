const staffTaskService = require('../../src/modules/manager/staff-task/staff-task.service');
const StaffTask = require('../../src/models/staffTask.model');
const User = require('../../src/models/user.model');
const Room = require('../../src/models/room.model');

jest.mock('../../src/models/staffTask.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/room.model');

describe('Staff Task Service Unit Tests (UT051 - UT058)', () => {
  let mockStaffUser, mockRoomData, mockStaffTask;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStaffUser = {
      _id: '507f1f77bcf86cd799439011',
      full_name: 'Housekeeper A',
      status: 'active',
      role_id: { name: 'Housekeeping' }
    };

    mockRoomData = {
      _id: '507f1f77bcf86cd799439022',
      roomName: '101',
      isActive: true,
      room_type_id: { name: 'Deluxe' }
    };

    mockStaffTask = {
      _id: '507f1f77bcf86cd799439033',
      title: 'Cleaning Task 101',
      assigned_staff_id: '507f1f77bcf86cd799439011',
      room_number: '101',
      room_type: 'Deluxe',
      status: 'Assigned',
      work_date: new Date('2026-08-01T00:00:00.000Z'),
      start_time: '08:00',
      end_time: '09:00',
      duration_minutes: 60
    };

    // Default mock for StaffTask.find chain (.lean() / .select().lean())
    StaffTask.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      }),
      sort: jest.fn().mockResolvedValue([mockStaffTask])
    });
  });

  it('UT051: Lấy danh sách nhân viên dọn phòng (getStaffMembers)', async () => {
    User.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([mockStaffUser])
      })
    });

    const staffMembers = await staffTaskService.getStaffMembers();

    expect(staffMembers).toHaveLength(1);
    expect(staffMembers[0].role).toBe('housekeeping');
  });

  it('UT052: Lấy danh sách staff tasks (getStaffTasks)', async () => {
    StaffTask.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([mockStaffTask])
    });

    const tasks = await staffTaskService.getStaffTasks();

    expect(StaffTask.find).toHaveBeenCalledWith(
      expect.objectContaining({ staff_type: 'housekeeping' })
    );
    expect(tasks).toHaveLength(1);
  });

  it('UT053: Tạo staff task mới thành công (createStaffTask)', async () => {
    User.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockStaffUser)
      })
    });
    Room.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockRoomData)
    });

    StaffTask.create.mockResolvedValue(mockStaffTask);

    const taskInput = {
      title: 'Cleaning Task 101',
      assigned_staff_id: '507f1f77bcf86cd799439011',
      room_number: '101',
      deadline: '2026-08-01',
      start_time: '08:00',
      end_time: '09:00'
    };

    const created = await staffTaskService.createStaffTask(taskInput, { full_name: 'Manager A' });

    expect(StaffTask.create).toHaveBeenCalled();
    expect(created.title).toBe('Cleaning Task 101');
  });

  it('UT054: Báo lỗi khi tạo task thiếu tiêu đề', async () => {
    const invalidInput = {
      assigned_staff_id: '507f1f77bcf86cd799439011',
      room_number: '101'
    };

    await expect(staffTaskService.createStaffTask(invalidInput)).rejects.toHaveProperty('message', 'Vui long nhap tieu de nhiem vu.');
  });

  it('UT055: Báo lỗi khi tạo task chọn nhân viên không hợp lệ', async () => {
    User.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      })
    });

    const input = {
      title: 'Clean',
      assigned_staff_id: 'invalid_id',
      room_number: '101'
    };

    await expect(staffTaskService.createStaffTask(input)).rejects.toHaveProperty('status', 400);
  });

  it('UT056: Báo lỗi khi tạo task trùng khung giờ làm việc của phòng', async () => {
    User.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockStaffUser)
      })
    });
    Room.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockRoomData)
    });

    StaffTask.find.mockImplementation((filter) => {
      if (filter.room_number) {
        return {
          lean: jest.fn().mockResolvedValue([
            { start_time: '08:00', end_time: '09:00', room_number: '101' }
          ])
        };
      }
      return {
        lean: jest.fn().mockResolvedValue([])
      };
    });

    const input = {
      title: 'Clean',
      assigned_staff_id: '507f1f77bcf86cd799439011',
      room_number: '101',
      deadline: '2026-08-01',
      start_time: '08:00',
      end_time: '09:00'
    };

    await expect(staffTaskService.createStaffTask(input)).rejects.toHaveProperty('status', 409);
  });

  it('UT057: Cập nhật staff task thành công (updateStaffTask)', async () => {
    StaffTask.findById.mockResolvedValue(mockStaffTask);
    User.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockStaffUser)
      })
    });
    Room.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockRoomData)
    });
    StaffTask.findByIdAndUpdate.mockResolvedValue({ ...mockStaffTask, title: 'Updated Title' });

    const updateInput = {
      title: 'Updated Title',
      assigned_staff_id: '507f1f77bcf86cd799439011',
      room_number: '101',
      deadline: '2026-08-01',
      start_time: '08:00',
      end_time: '09:30'
    };

    const updated = await staffTaskService.updateStaffTask('507f1f77bcf86cd799439033', updateInput);

    expect(updated.title).toBe('Updated Title');
  });

  it('UT058: Báo lỗi khi cập nhật task không tồn tại (404)', async () => {
    StaffTask.findById.mockResolvedValue(null);

    await expect(staffTaskService.updateStaffTask('507f1f77bcf86cd799439033', {})).rejects.toHaveProperty('status', 404);
  });
});
