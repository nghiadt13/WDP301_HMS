const StaffTask = require('../../../models/staffTask.model');
const User = require('../../../models/user.model');
const Room = require('../../../models/room.model');
const mongoose = require('mongoose');

const COUNTED_SCHEDULE_STATUSES = ['NotStarted', 'Assigned', 'Accepted', 'Cleaning', 'InProgress', 'In Progress', 'Completed'];
const MAX_DAILY_MINUTES = 8 * 60;
const MAX_WEEKLY_MINUTES = 48 * 60;
const MIN_STAFF_BREAK_MINUTES = 15;

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

const parseTime = (value, label) => {
  const normalized = String(value || '').trim();
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(normalized);
  if (!match) throw createHttpError(`${label} phai dung dinh dang HH:mm.`);
  return { value: normalized, minutes: Number(match[1]) * 60 + Number(match[2]) };
};

const getDayBounds = (value) => {
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) throw createHttpError('Vui long chon ngay lam viec hop le.');
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const getWeekBounds = (value) => {
  const { start } = getDayBounds(value);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() + 1 - day);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
};

const intervalsOverlap = (firstStart, firstEnd, secondStart, secondEnd) => (
  firstStart < secondEnd && firstEnd > secondStart
);

const violatesBreakTime = (firstStart, firstEnd, secondStart, secondEnd) => (
  firstStart < secondEnd + MIN_STAFF_BREAK_MINUTES && firstEnd + MIN_STAFF_BREAK_MINUTES > secondStart
);

const resolveHousekeepingStaff = async (staffId) => {
  if (!mongoose.isValidObjectId(staffId)) {
    throw createHttpError('Nhan vien duoc chon khong hop le.');
  }
  const staff = await User.findOne({ _id: staffId, status: 'active' })
    .populate('role_id')
    .select('full_name role_id');
  const roleName = String(staff?.role_id?.name || '').toLowerCase();
  if (!staff || !roleName.includes('housekeeping')) {
    throw createHttpError('Nhan vien duoc chon khong ton tai, khong hoat dong hoac khong thuoc bo phan don phong.');
  }
  return staff;
};

const resolveRoom = async (roomNumber) => {
  const room = await Room.findOne({ roomName: String(roomNumber || '').trim(), isActive: true })
    .populate('room_type_id', 'name');
  if (!room) throw createHttpError('Phong duoc chon khong ton tai hoac da ngung hoat dong.');
  if (!room.room_type_id?.name) throw createHttpError('Phong duoc chon chua co loai phong hop le.');
  return room;
};

const getTaskDuration = (task) => {
  if (task.duration_minutes) return Number(task.duration_minutes);
  if (!task.start_time || !task.end_time) return 0;
  return parseTime(task.end_time, 'Gio ket thuc').minutes - parseTime(task.start_time, 'Gio bat dau').minutes;
};

const validateScheduleCapacity = async ({ staffId, roomNumber, workDate, startMinutes, endMinutes, excludeTaskId = null }) => {
  const { start: dayStart, end: dayEnd } = getDayBounds(workDate);
  const commonFilter = {
    task_origin: 'manager_schedule',
    status: { $in: COUNTED_SCHEDULE_STATUSES },
    work_date: { $gte: dayStart, $lt: dayEnd },
  };
  if (excludeTaskId) commonFilter._id = { $ne: excludeTaskId };

  const [staffDayTasks, roomDayTasks] = await Promise.all([
    StaffTask.find({ ...commonFilter, assigned_staff_id: staffId }).lean(),
    StaffTask.find({ ...commonFilter, room_number: roomNumber }).lean(),
  ]);

  const hasOverlap = (task) => intervalsOverlap(
    startMinutes,
    endMinutes,
    parseTime(task.start_time, 'Gio bat dau').minutes,
    parseTime(task.end_time, 'Gio ket thuc').minutes
  );
  const hasStaffConflict = (task) => violatesBreakTime(
    startMinutes,
    endMinutes,
    parseTime(task.start_time, 'Gio bat dau').minutes,
    parseTime(task.end_time, 'Gio ket thuc').minutes
  );
  const staffConflict = staffDayTasks.find(hasStaffConflict);
  if (staffConflict) {
    throw createHttpError(`Nhan vien da co lich ${staffConflict.start_time}-${staffConflict.end_time} tai phong ${staffConflict.room_number}. Moi lich cua cung nhan vien phai cach nhau it nhat ${MIN_STAFF_BREAK_MINUTES} phut.`, 409);
  }
  const roomConflict = roomDayTasks.find(hasOverlap);
  if (roomConflict) {
    throw createHttpError(`Phong ${roomNumber} da duoc giao trong khung gio ${roomConflict.start_time}-${roomConflict.end_time}.`, 409);
  }

  const duration = endMinutes - startMinutes;
  const dailyMinutes = staffDayTasks.reduce((sum, task) => sum + getTaskDuration(task), 0) + duration;
  if (dailyMinutes > MAX_DAILY_MINUTES) {
    throw createHttpError('Tong thoi gian duoc xep cho nhan vien vuot qua 8 gio trong ngay.', 409);
  }

  const { start: weekStart, end: weekEnd } = getWeekBounds(workDate);
  const weeklyFilter = {
    task_origin: 'manager_schedule',
    status: { $in: COUNTED_SCHEDULE_STATUSES },
    assigned_staff_id: staffId,
    work_date: { $gte: weekStart, $lt: weekEnd },
  };
  if (excludeTaskId) weeklyFilter._id = { $ne: excludeTaskId };
  const weekTasks = await StaffTask.find(weeklyFilter).select('duration_minutes start_time end_time').lean();
  const weeklyMinutes = weekTasks.reduce((sum, task) => sum + getTaskDuration(task), 0) + duration;
  if (weeklyMinutes > MAX_WEEKLY_MINUTES) {
    throw createHttpError('Tong thoi gian duoc xep cho nhan vien vuot qua 48 gio trong tuan.', 409);
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

  if (!String(options.roomType || data.room_type || data.roomType || '').trim()) {
    throw createHttpError('Vui lòng chọn phòng có loại phòng hợp lệ.');
  }

  if (!data.deadline) {
    throw createHttpError('Vui long chon ngay lam viec.');
  }

  if (!options.allowPastDeadline) {
    assertFutureOrToday(data.deadline);
  }

  const nextStatus = normalizeWorkflowStatus(data.status, options.defaultStatus || 'Assigned');
  const startTime = parseTime(data.start_time, 'Gio bat dau');
  const endTime = parseTime(data.end_time, 'Gio ket thuc');
  if (endTime.minutes <= startTime.minutes) {
    throw createHttpError('Gio ket thuc phai sau gio bat dau.');
  }
  const { start: workDate } = getDayBounds(data.deadline);
  const deadline = new Date(workDate);
  deadline.setMinutes(endTime.minutes);
  const durationMinutes = endTime.minutes - startTime.minutes;
  if (durationMinutes < 15) {
    throw createHttpError('Moi cong viec phai keo dai it nhat 15 phut.');
  }
  if (!options.allowPastDeadline && deadline <= new Date()) {
    throw createHttpError('Gio ket thuc cua lich phai o trong tuong lai.');
  }

  return {
    title: String(data.title).trim(),
    description: String(data.description || '').trim(),
    staff_type: 'housekeeping',
    assigned_staff_id: data.assigned_staff_id,
    assigned_to: String(options.assignedTo || data.assigned_to || '').trim(),
    room_number: String(data.room_number).trim(),
    room_type: String(options.roomType || data.room_type || data.roomType || '').trim(),
    priority: data.priority || 'medium',
    status: nextStatus,
    assignedBy: String(options.assignedBy || data.assignedBy || 'Manager').trim() || 'Manager',
    cleaningType: String(data.cleaningType || data.cleaning_type || 'Housekeeping Schedule').trim(),
    task_origin: 'manager_schedule',
    work_date: workDate,
    start_time: startTime.value,
    end_time: endTime.value,
    duration_minutes: durationMinutes,
    receptionistNote: String(data.receptionistNote || data.note || '').trim(),
    guestRequest: String(data.guestRequest || '').trim(),
    checkoutTime: data.checkoutTime ? new Date(data.checkoutTime) : undefined,
    deadline,
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
    const [staff, room] = await Promise.all([
      resolveHousekeepingStaff(data.assigned_staff_id),
      resolveRoom(data.room_number),
    ]);
    const payload = buildStaffTaskPayload(data, {
      defaultStatus: 'Assigned',
      assignedBy,
      assignedTo: staff.full_name,
      roomType: room.room_type_id.name,
    });
    await validateScheduleCapacity({
      staffId: payload.assigned_staff_id,
      roomNumber: payload.room_number,
      workDate: payload.work_date,
      startMinutes: parseTime(payload.start_time, 'Gio bat dau').minutes,
      endMinutes: parseTime(payload.end_time, 'Gio ket thuc').minutes,
    });
    const task = await StaffTask.create(payload);
    return task;
  },

  async updateStaffTask(id, data, user = {}) {
    const assignedBy = String(user?.full_name || '').trim() || 'Manager';
    const currentTask = await StaffTask.findById(id);
    if (!currentTask) throw createHttpError('Khong tim thay nhiem vu.', 404);
    if (!['Assigned', 'NotStarted'].includes(String(currentTask.status))) {
      throw createHttpError('Chi lich chua duoc nhan moi co the chinh sua.', 409);
    }

    const [staff, room] = await Promise.all([
      resolveHousekeepingStaff(data.assigned_staff_id),
      resolveRoom(data.room_number),
    ]);
    const payload = buildStaffTaskPayload(
      {
        ...data,
        status: currentTask.status,
        deadline: currentTask.work_date || currentTask.deadline,
      },
      {
        defaultStatus: currentTask.status || 'Assigned',
        assignedBy,
        assignedTo: staff.full_name,
        roomType: room.room_type_id.name,
        allowPastDeadline: true,
      }
    );
    await validateScheduleCapacity({
      staffId: payload.assigned_staff_id,
      roomNumber: payload.room_number,
      workDate: payload.work_date,
      startMinutes: parseTime(payload.start_time, 'Gio bat dau').minutes,
      endMinutes: parseTime(payload.end_time, 'Gio ket thuc').minutes,
      excludeTaskId: currentTask._id,
    });

    const task = await StaffTask.findByIdAndUpdate(
      id,
      payload,
      { new: true, runValidators: true }
    );
    if (!task) throw createHttpError('Khong tim thay nhiem vu.', 404);
    return task;
  },

  async closeStaffTask(id) {
    const task = await StaffTask.findById(id);
    if (!task) throw createHttpError('Khong tim thay nhiem vu.', 404);
    throw createHttpError('Chi nhan vien don phong moi duoc xac nhan hoan thanh lich.', 403);
  },

  async cancelStaffTask(id) {
    const task = await StaffTask.findById(id);
    if (!task) throw createHttpError('Khong tim thay nhiem vu.', 404);
    throw createHttpError('Lich lam viec khong ho tro huy sau khi da tao.', 403);
  },
};

module.exports = staffTaskService;

