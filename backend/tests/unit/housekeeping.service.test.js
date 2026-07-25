const housekeepingService = require('../../src/modules/manager/housekeeping/housekeeping.service');
const StaffTask = require('../../src/models/staffTask.model');
const Room = require('../../src/models/room.model');
const CustomerServiceRequest = require('../../src/models/customerServiceRequest.model');
const MaintenanceRequest = require('../../src/models/maintenanceRequest.model');
const RoomInventoryItem = require('../../src/models/roomInventoryItem.model');
const User = require('../../src/models/user.model');

jest.mock('../../src/models/staffTask.model');
jest.mock('../../src/models/room.model');
jest.mock('../../src/models/customerServiceRequest.model');
jest.mock('../../src/models/maintenanceRequest.model');
jest.mock('../../src/models/roomInventoryItem.model');
jest.mock('../../src/models/user.model');

describe('Housekeeping Service Unit Tests (UT041 - UT050)', () => {
  let mockUser, mockManagerUser, mockTask, mockRoom;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      _id: 'user_hk_01',
      full_name: 'Housekeeper A',
      role_id: { name: 'Housekeeping' }
    };

    mockManagerUser = {
      _id: 'user_mgr_01',
      full_name: 'Manager B',
      role_id: { name: 'Manager' }
    };

    mockTask = {
      _id: 'task_001',
      title: 'Clean room 101',
      room_number: '101',
      staff_type: 'housekeeping',
      status: 'Assigned',
      assigned_staff_id: 'user_hk_01',
      save: jest.fn().mockResolvedValue(true)
    };

    mockRoom = {
      _id: 'room_101',
      roomName: '101',
      status: 'Dirty',
      save: jest.fn().mockResolvedValue(true)
    };

    User.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([mockUser])
        })
      })
    });
  });

  it('UT041: Lấy danh sách task housekeeping', async () => {
    StaffTask.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockTask])
      })
    });

    const tasks = await housekeepingService.getTasks({}, mockManagerUser);

    expect(StaffTask.find).toHaveBeenCalledWith(expect.objectContaining({ staff_type: 'housekeeping' }));
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('task_001');
  });

  it('UT042: Tạo task cleaning cho phòng checkout (confirmCheckout)', async () => {
    StaffTask.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(null)
    });
    Room.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockRoom)
    });
    Room.findOne.mockResolvedValueOnce(mockRoom); // first call without lean
    StaffTask.create.mockResolvedValue(mockTask);

    const result = await housekeepingService.confirmCheckout({ room_number: '101' }, mockManagerUser);

    expect(result.task.id).toBe('task_001');
  });

  it('UT043: Cập nhật trạng thái task sang Cleaning', async () => {
    StaffTask.findById.mockResolvedValue(mockTask);
    Room.findOne.mockResolvedValue(mockRoom);

    const updated = await housekeepingService.updateTaskStatus('task_001', { status: 'Cleaning' }, mockManagerUser);

    expect(mockTask.status).toBe('Cleaning');
    expect(updated.status).toBe('Cleaning');
  });

  it('UT044: Lấy thông tin dashboard housekeeping', async () => {
    StaffTask.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([mockTask]) });
    Room.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([mockRoom]) });
    CustomerServiceRequest.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    MaintenanceRequest.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

    const dashboard = await housekeepingService.getDashboard(mockManagerUser);

    expect(dashboard).toHaveProperty('newCleaningRequests');
    expect(dashboard).toHaveProperty('dirtyRooms', 1);
  });

  it('UT045: Lấy thông tin chi tiết task theo ID', async () => {
    StaffTask.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockTask) });

    const task = await housekeepingService.getTaskById('task_001', mockManagerUser);

    expect(StaffTask.findById).toHaveBeenCalledWith('task_001');
    expect(task.id).toBe('task_001');
  });

  it('UT046: Báo lỗi 404 khi xem task không tồn tại', async () => {
    StaffTask.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    await expect(housekeepingService.getTaskById('nonexistent', mockManagerUser)).rejects.toHaveProperty('message', 'Task not found');
  });

  it('UT047: Bắt đầu thực hiện task (startCleaningTask) thành công từ trạng thái Accepted', async () => {
    const acceptedTask = { ...mockTask, status: 'Accepted', save: jest.fn().mockResolvedValue(true) };
    StaffTask.findById.mockResolvedValue(acceptedTask);
    MaintenanceRequest.findOne.mockResolvedValue(null);
    Room.findOne.mockResolvedValue(mockRoom);

    const started = await housekeepingService.startCleaningTask('task_001', mockManagerUser);

    expect(acceptedTask.status).toBe('Cleaning');
    expect(started.status).toBe('Cleaning');
  });

  it('UT048: Hoàn thành task (completeCleaningTask) thành công', async () => {
    const cleaningTask = { ...mockTask, status: 'Cleaning', save: jest.fn().mockResolvedValue(true) };
    StaffTask.findById.mockResolvedValue(cleaningTask);
    MaintenanceRequest.findOne.mockResolvedValue(null);
    Room.findOne.mockResolvedValue(mockRoom);

    const completed = await housekeepingService.completeCleaningTask('task_001', mockManagerUser, { completion_note: 'Done' });

    expect(cleaningTask.status).toBe('Completed');
    expect(mockRoom.status).toBe('Available');
    expect(completed.status).toBe('Completed');
  });

  it('UT049: Báo lỗi 409 khi hoàn thành task nếu bảo trì chưa xong', async () => {
    const cleaningTask = { ...mockTask, status: 'Cleaning' };
    StaffTask.findById.mockResolvedValue(cleaningTask);
    MaintenanceRequest.findOne.mockResolvedValue({ _id: 'maint_1', status: 'InProgress' });

    await expect(housekeepingService.completeCleaningTask('task_001', mockManagerUser)).rejects.toHaveProperty(
      'message',
      'Maintenance must be completed before room can be marked available'
    );
  });

  it('UT050: Hủy task housekeeping (cancelCleaningTask)', async () => {
    StaffTask.findById.mockResolvedValue(mockTask);
    Room.findOne.mockResolvedValue(mockRoom);

    const cancelled = await housekeepingService.cancelCleaningTask('task_001', mockManagerUser);

    expect(mockTask.status).toBe('Cancelled');
    expect(mockRoom.status).toBe('Dirty');
    expect(cancelled.status).toBe('Cancelled');
  });
});
