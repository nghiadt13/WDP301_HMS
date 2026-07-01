const CustomerFeedback = require('../models/customerFeedback.model');
const MinibarItem = require('../models/minibarItem.model');
const StaffTask = require('../models/staffTask.model');
const User = require('../models/user.model');

const mockStaffMembers = [
  { _id: 'mock-housekeeping-1', full_name: 'Nguyen Thi Hoa', role: 'housekeeping' },
  { _id: 'mock-housekeeping-2', full_name: 'Le Van Minh', role: 'housekeeping' },
  { _id: 'mock-technical-1', full_name: 'Tran Quoc Bao', role: 'technical' },
  { _id: 'mock-technical-2', full_name: 'Pham Duc Anh', role: 'technical' },
];

const normalizeStatus = (status = '') => String(status).toLowerCase();

const createHttpError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const isValidRoomNumber = (roomNumber) => /^[1-9][0-9]{2,3}$/.test(String(roomNumber || '').trim());

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
    throw createHttpError('So phong phai co 3 den 4 chu so va khong bat dau bang 0.');
  }

  if (!data.deadline) {
    throw createHttpError('Vui long chon han hoan thanh.');
  }

  assertFutureOrToday(data.deadline);

  return {
    title: String(data.title).trim(),
    description: String(data.description || '').trim(),
    staff_type: data.staff_type || 'housekeeping',
    assigned_staff_id: data.assigned_staff_id,
    assigned_to: String(data.assigned_to || '').trim(),
    room_number: String(data.room_number).trim(),
    priority: data.priority || 'medium',
    status: data.status || 'assigned',
    deadline: new Date(data.deadline),
  };
};

const buildMinibarPayload = (data) => {
  const price = Number(data.price);

  if (!String(data.name || '').trim()) {
    throw createHttpError('Vui long nhap ten mon minibar.');
  }

  if (!String(data.category || '').trim()) {
    throw createHttpError('Vui long chon danh muc.');
  }

  if (!Number.isFinite(price) || price < 0) {
    throw createHttpError('Gia khong duoc nho hon 0.');
  }

  return {
    name: String(data.name).trim(),
    category: String(data.category).trim(),
    price,
    stock_status: data.stock_status || 'in_stock',
    image_url: String(data.image_url || '').trim(),
    description: String(data.description || '').trim(),
  };
};

const managerService = {
  async getStaffMembers() {
    const users = await User.find({ status: 'active' }).populate('role_id').select('full_name role_id');
    const staffMembers = users
      .map((user) => {
        const roleName = String(user.role_id?.name || '').toLowerCase();
        let role = '';
        if (roleName.includes('housekeeping')) role = 'housekeeping';
        if (roleName.includes('technical')) role = 'technical';
        if (!role) return null;
        return { _id: String(user._id), full_name: user.full_name, role };
      })
      .filter(Boolean);

    return staffMembers.length ? staffMembers : mockStaffMembers;
  },

  async getStaffTasks(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.staff_type) filter.staff_type = query.staff_type;
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
    const task = await StaffTask.findByIdAndUpdate(id, { status: 'closed' }, { new: true, runValidators: true });
    if (!task) throw createHttpError('Khong tim thay nhiem vu.', 404);
    return task;
  },

  async cancelStaffTask(id) {
    const task = await StaffTask.findByIdAndUpdate(id, { status: 'canceled' }, { new: true, runValidators: true });
    if (!task) throw createHttpError('Khong tim thay nhiem vu.', 404);
    return task;
  },

  async getMinibarItems(query = {}) {
    const filter = {};
    if (query.stock_status) filter.stock_status = query.stock_status;
    if (query.is_active !== undefined) filter.is_active = query.is_active === 'true';
    return MinibarItem.find(filter).sort({ createdAt: -1 });
  },

  async createMinibarItem(data) {
    return MinibarItem.create(buildMinibarPayload(data));
  },

  async updateMinibarItem(id, data) {
    const item = await MinibarItem.findByIdAndUpdate(id, buildMinibarPayload(data), { new: true, runValidators: true });
    if (!item) throw createHttpError('Khong tim thay mon minibar.', 404);
    return item;
  },

  async deactivateMinibarItem(id) {
    const item = await MinibarItem.findByIdAndUpdate(id, { is_active: false }, { new: true, runValidators: true });
    if (!item) throw createHttpError('Khong tim thay mon minibar.', 404);
    return item;
  },

  async activateMinibarItem(id) {
    const item = await MinibarItem.findByIdAndUpdate(id, { is_active: true }, { new: true, runValidators: true });
    if (!item) throw createHttpError('Khong tim thay mon minibar.', 404);
    return item;
  },

  async getCustomerFeedbacks(query = {}) {
    const filter = {};
    if (query.rating) filter.rating = Number(query.rating);
    if (query.status) filter.status = query.status;
    return CustomerFeedback.find(filter).sort({ submitted_at: -1, createdAt: -1 });
  },

  async respondCustomerFeedback(id, responseText, user) {
    const cleanResponse = String(responseText || '').trim();
    if (cleanResponse.length < 2) {
      throw createHttpError('Vui long nhap noi dung phan hoi.');
    }

    const response = {
      responseText: cleanResponse,
      responderId: user?._id || null,
      responderName: user?.full_name || 'Manager',
      respondedAt: new Date(),
    };

    const feedback = await CustomerFeedback.findByIdAndUpdate(
      id,
      {
        $set: {
          response_text: cleanResponse,
          status: 'responded',
          responded_at: response.respondedAt,
        },
        $push: { manager_responses: response },
      },
      { new: true, runValidators: true }
    );

    if (!feedback) throw createHttpError('Khong tim thay gop y.', 404);
    return feedback;
  },

  async archiveCustomerFeedback(id) {
    const feedback = await CustomerFeedback.findByIdAndUpdate(id, { status: 'archived' }, { new: true, runValidators: true });
    if (!feedback) throw createHttpError('Khong tim thay gop y.', 404);
    return feedback;
  },
};

module.exports = managerService;

