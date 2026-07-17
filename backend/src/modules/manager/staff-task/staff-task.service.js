const StaffTask = require('../../../models/staffTask.model');
const User = require('../../../models/user.model');

const createHttpError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const isValidRoomNumber = (roomNumber) => {
  const value = String(roomNumber || '').trim();
  return /^[1-9][0-9]{2,3}$/.test(value) || /^[A-Za-z][A-Za-z0-9\s-]{1,39}$/.test(value);
};

const assertFutureOrToday = (deadline) => {
  const inputDate = new Date(deadline);
  if (Number.isNaN(inputDate.getTime())) {
    throw createHttpError('Vui long chon han hoan thanh hop le.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  inputDate.setHours(0, 0, 0, 0);

  if (inputDate < today) {
    throw createHttpError('Han hoan thanh khong duoc la ngay trong qua khu.');
  }
};

const buildStaffTaskPayload = (data) => {
  if (!String(data.title || '').trim()) {
    throw createHttpError('Vui long nhap tieu de nhiem vu.');
  }

  if (!String(data.assigned_staff_id || '').trim()) {
    throw createHttpError('Vui long chon nhan vien duoc giao.');
  }

  if (!String(data.room_number || '').trim()) {
    throw createHttpError('Vui long nhap so phong.');
  }

  if (!isValidRoomNumber(data.room_number)) {
    throw createHttpError('Số phòng phải là số 3-4 chữ số hoặc mã phòng hợp lệ trong danh sách.');
  }

  if (!String(data.room_type || data.roomType || '').trim()) {
    throw createHttpError('Vui lòng chọn phòng có loại phòng hợp lệ.');
  }

  if (!data.deadline) {
    throw createHttpError('Vui long chon han hoan thanh.');
  }

  assertFutureOrToday(data.deadline);

  const normalizedStatus = String(data.status || '').trim();
  const nextStatus = normalizedStatus === 'Completed' || normalizedStatus === 'Cancelled'
    ? normalizedStatus
    : 'NotStarted';

  return {
    title: String(data.title).trim(),
    description: String(data.description || '').trim(),
    staff_type: 'housekeeping',
    assigned_staff_id: data.assigned_staff_id,
    assigned_to: String(data.assigned_to || '').trim(),
    room_number: String(data.room_number).trim(),
    room_type: String(data.room_type || data.roomType || '').trim(),
    priority: data.priority || 'medium',
    status: nextStatus,
    deadline: new Date(data.deadline),
  };
};

const staffTaskService = {
  async getStaffMembers() {
    const users = await User.find({ status: 'active' }).populate('role_id').select('full_name role_id');
    const staffMembers = users
      .map((user) => {
        const roleName = String(user.role_id?.name || '').toLowerCase();
        let role = '';
        if (roleName.includes('housekeeping')) role = 'housekeeping';
        if (!role) return null;
        return { _id: String(user._id), full_name: user.full_name, role };
      })
      .filter(Boolean);

    return staffMembers;
  },

  async getStaffTasks(query = {}) {
    const filter = {
      staff_type: 'housekeeping',
      room_type: { $nin: [null, ''] },
    };
    if (query.status) filter.status = query.status;
    return StaffTask.find(filter).sort({ createdAt: -1 });
  },

  async createStaffTask(data) {
    return StaffTask.create(buildStaffTaskPayload(data));
  },

  async updateStaffTask(id, data) {
    const task = await StaffTask.findByIdAndUpdate(id, buildStaffTaskPayload(data), { new: true, runValidators: true });
    if (!task) throw createHttpError('Khong tim thay nhiem vu.', 404);
    return task;
  },

  async closeStaffTask(id) {
    const task = await StaffTask.findByIdAndUpdate(id, { status: 'Completed' }, { new: true, runValidators: true });
    if (!task) throw createHttpError('Khong tim thay nhiem vu.', 404);
    return task;
  },

  async cancelStaffTask(id) {
    const task = await StaffTask.findByIdAndUpdate(id, { status: 'Cancelled' }, { new: true, runValidators: true });
    if (!task) throw createHttpError('Khong tim thay nhiem vu.', 404);
    return task;
  },
};

module.exports = staffTaskService;

