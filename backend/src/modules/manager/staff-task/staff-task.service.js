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

const normalizeWorkflowStatus = (status, fallback = 'Assigned') => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'assigned') return 'Assigned';
  if (normalized === 'accepted') return 'Accepted';
  if (normalized === 'cleaning') return 'Cleaning';
  if (normalized === 'inprogress' || normalized === 'in progress') return 'InProgress';
  if (normalized === 'waitingmaintenance') return 'WaitingMaintenance';
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'Cancelled';
  return fallback;
};

const buildStaffTaskPayload = (data, options = {}) => {
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

  if (!options.allowPastDeadline) {
    assertFutureOrToday(data.deadline);
  }

  const nextStatus = normalizeWorkflowStatus(data.status, options.defaultStatus || 'Assigned');

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
    assignedBy: String(options.assignedBy || data.assignedBy || 'Manager').trim() || 'Manager',
    cleaningType: String(data.cleaningType || data.cleaning_type || 'Housekeeping Schedule').trim(),
    receptionistNote: String(data.receptionistNote || data.note || '').trim(),
    guestRequest: String(data.guestRequest || '').trim(),
    checkoutTime: data.checkoutTime ? new Date(data.checkoutTime) : undefined,
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

  async createStaffTask(data, user = {}) {
    const assignedBy = String(user?.full_name || '').trim() || 'Manager';
    const task = await StaffTask.create(buildStaffTaskPayload(data, { defaultStatus: 'Assigned', assignedBy }));
    return task;
  },

  async updateStaffTask(id, data, user = {}) {
    const assignedBy = String(user?.full_name || '').trim() || 'Manager';
    const currentTask = await StaffTask.findById(id);
    if (!currentTask) throw createHttpError('Khong tim thay nhiem vu.', 404);

    const task = await StaffTask.findByIdAndUpdate(
      id,
      buildStaffTaskPayload(
        {
          ...data,
          status: currentTask.status,
          deadline: currentTask.deadline,
        },
        { defaultStatus: currentTask.status || 'Assigned', assignedBy, allowPastDeadline: true }
      ),
      { new: true, runValidators: true }
    );
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

