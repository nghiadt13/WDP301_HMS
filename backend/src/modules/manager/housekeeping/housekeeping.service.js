const StaffTask = require('../../../models/staffTask.model');
const Room = require('../../../models/room.model');
const CustomerServiceRequest = require('../../../models/customerServiceRequest.model');
const Inspection = require('../../../models/inspection.model');
const MinibarItem = require('../../../models/minibarItem.model');
const MaintenanceRequest = require('../../../models/maintenanceRequest.model');
const User = require('../../../models/user.model');
const managerRoomService = require('../room/room.service');
const { createHttpError } = require('../../../utils/error.utils');

const normalizeRole = (user) => String(user?.role_id?.name || user?.role || '').toLowerCase();

const canAccessTask = (user, task) => {
  const role = normalizeRole(user);
  if (role.includes('manager') || role.includes('receptionist')) return true;
  if (role.includes('housekeeping')) {
    const assignedId = String(task?.assigned_staff_id || '');
    const currentId = String(user?._id || '');
    if (!assignedId) return true;
    return assignedId === currentId;
  }
  return false;
};

const isActiveTaskStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  return !['completed', 'cancelled', 'closed'].includes(normalized);
};

const isHousekeepingTask = (task) => String(task?.staff_type || '').toLowerCase() === 'housekeeping';
const isManagerAssignedTask = (task) => /manager/i.test(String(task?.assignedBy || ''));

const normalizeTaskStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'assigned') return 'Assigned';
  if (normalized === 'accepted') return 'Accepted';
  if (['cleaning', 'in progress', 'inprogress'].includes(normalized)) return 'Cleaning';
  if (['waitingmaintenance', 'waiting maintenance'].includes(normalized)) return 'WaitingMaintenance';
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'cancelled') return 'Cancelled';
  return status;
};

const normalizeMaintenanceValue = (value) => String(value || '').trim();

const ensureWorkflowRole = (user, allowedRoles) => {
  const role = normalizeRole(user);
  const canAccess = allowedRoles.some((allowedRole) => role.includes(allowedRole));
  if (!canAccess) {
    throw createHttpError('Forbidden', 403);
  }
  return role;
};

const getAssignedHousekeeping = async () => {
  const users = await User.find({ status: 'active' }).populate('role_id').select('full_name role_id').lean();
  const housekeepingStaff = users.find((item) => String(item?.role_id?.name || '').toLowerCase().includes('housekeeping'));
  if (!housekeepingStaff) {
    return {
      assigned_staff_id: null,
      assigned_to: 'Housekeeping Team',
    };
  }

  return {
    assigned_staff_id: housekeepingStaff._id,
    assigned_to: housekeepingStaff.full_name,
  };
};

const createCleaningTaskForRoom = async ({
  roomNumber,
  priority = 'medium',
  receptionistNote = '',
  guestRequest = '',
  cleaningType = 'Checkout Cleaning',
  assignedBy = 'Receptionist',
  checkoutTime,
}) => {
  if (!roomNumber) {
    throw createHttpError('Room number is required', 400);
  }

  const existingTask = await StaffTask.findOne({
    room_number: roomNumber,
    staff_type: 'housekeeping',
    cleaningType: { $in: ['Checkout Cleaning', 'Post Maintenance Cleaning'] },
    status: { $nin: ['Completed', 'Cancelled'] },
  }).sort({ createdAt: -1 });

  if (existingTask) {
    return existingTask;
  }

  const room = await Room.findOne({ roomName: roomNumber });
  if (!room) {
    throw createHttpError('Room not found', 404);
  }

  room.status = 'Dirty';
  room.inspectionStatus = 'Pending';
  await room.save();

  const assigned = await getAssignedHousekeeping();
  return StaffTask.create({
    title: `Cleaning required for room ${roomNumber}`,
    description: 'Checkout confirmed by receptionist. Room needs cleaning before next arrival.',
    staff_type: 'housekeeping',
    assigned_staff_id: assigned.assigned_staff_id,
    assigned_to: assigned.assigned_to,
    room_number: roomNumber,
    priority,
    status: 'Assigned',
    deadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
    assignedBy,
    receptionistNote,
    guestRequest,
    cleaningType,
    checkoutTime: checkoutTime ? new Date(checkoutTime) : new Date(),
  });
};

const mapTask = (task) => ({
  id: task._id,
  title: task.title,
  description: task.description,
  room_number: task.room_number,
  status: task.status,
  priority: task.priority,
  staff_type: task.staff_type,
  assigned_staff_id: task.assigned_staff_id,
  assigned_to: task.assigned_to,
  deadline: task.deadline,
  assignedBy: task.assignedBy,
  acceptedAt: task.acceptedAt,
  startedAt: task.startedAt,
  completedAt: task.completedAt,
  cleaningType: task.cleaningType,
  receptionistNote: task.receptionistNote,
  guestRequest: task.guestRequest,
  checkoutTime: task.checkoutTime,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

const mapInspection = (inspection) => ({
  id: inspection._id,
  room_number: inspection.room_number,
  room: inspection.room || inspection.room_number,
  guest: inspection.guest || '',
  checklist: inspection.checklist || {},
  damage: inspection.damage || [],
  lostItem: inspection.lostItem || [],
  minibar: inspection.minibar || [],
  minibarReport: {
    items: inspection.invoice_items || [],
    total: Number(inspection.minibar_total || 0),
  },
  photos: inspection.photos || [],
  note: inspection.note || '',
  status: inspection.status,
  remarks: inspection.remarks,
  minibar_used: inspection.minibar_used,
  minibar_total: Number(inspection.minibar_total || 0),
  invoice_items: inspection.invoice_items || [],
  missing_items: inspection.missing_items || [],
  damaged_items: inspection.damaged_items || [],
  maintenance_required: inspection.maintenance_required,
  task_id: inspection.task_id,
  room_status_before: inspection.room_status_before,
  room_status_after: inspection.room_status_after,
  createdAt: inspection.createdAt,
  updatedAt: inspection.updatedAt,
});

const mapServiceRequest = (request) => ({
  id: request._id,
  customer_id: request.customer_id || null,
  room_number: request.room_number,
  service_name: request.service_name,
  service_category: request.service_category,
  assigned_department: request.assigned_department || 'Housekeeping',
  assigned_staff_id: request.assigned_staff_id || null,
  assigned_to: request.assigned_to || 'Housekeeping Team',
  note: request.note,
  internal_note: request.internal_note || '',
  status: request.status,
  requested_at: request.requested_at,
  accepted_at: request.accepted_at,
  started_at: request.started_at,
  handled_at: request.handled_at,
  canceled_at: request.canceled_at,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

const SERVICE_REQUEST_STATUSES = ['requested', 'accepted', 'in_progress', 'handled', 'canceled'];

const isHousekeepingAssignedRequest = (request) => {
  const department = String(request?.assigned_department || '').toLowerCase();
  const category = String(request?.service_category || '').toLowerCase();
  const assignee = String(request?.assigned_to || '').toLowerCase();
  return department.includes('housekeeping') || category.includes('housekeeping') || assignee.includes('housekeeping');
};

const canAccessServiceRequest = (user, request) => {
  const role = normalizeRole(user);
  if (role.includes('manager') || role.includes('receptionist')) return true;
  if (!role.includes('housekeeping')) return false;
  if (!isHousekeepingAssignedRequest(request)) return false;

  const assignedId = String(request?.assigned_staff_id || '');
  const currentId = String(user?._id || '');
  if (!assignedId) return true;
  return assignedId === currentId;
};

const validateServiceRequestStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!SERVICE_REQUEST_STATUSES.includes(normalized)) {
    throw createHttpError('Invalid service request status', 400);
  }
  return normalized;
};

const updateServiceRequestLifecycle = (request, status, user) => {
  const nextStatus = validateServiceRequestStatus(status);
  const currentStatus = String(request.status || '').toLowerCase();

  const allowedTransitions = {
    requested: ['requested', 'accepted', 'in_progress', 'handled', 'canceled'],
    accepted: ['accepted', 'in_progress', 'handled', 'canceled'],
    in_progress: ['in_progress', 'handled', 'canceled'],
    handled: ['handled'],
    canceled: ['canceled'],
  };

  if (!(allowedTransitions[currentStatus] || []).includes(nextStatus)) {
    throw createHttpError('Service request cannot transition from its current status', 409);
  }

  request.status = nextStatus;
  const now = new Date();

  if (nextStatus === 'accepted') {
    request.accepted_at = request.accepted_at || now;
  }

  if (nextStatus === 'in_progress') {
    request.accepted_at = request.accepted_at || now;
    request.started_at = request.started_at || now;
  }

  if (nextStatus === 'handled') {
    request.accepted_at = request.accepted_at || now;
    request.started_at = request.started_at || now;
    request.handled_at = now;
    request.canceled_at = null;
  }

  if (nextStatus === 'canceled') {
    request.canceled_at = now;
  }

  if (user?._id && String(user?._id).trim()) {
    request.assigned_staff_id = request.assigned_staff_id || user._id;
    request.assigned_to = request.assigned_to || user.full_name || 'Housekeeping Team';
  }

  request.assigned_department = request.assigned_department || 'Housekeeping';
};

const mapMaintenanceRequest = (request) => ({
  id: request._id,
  room: request.room,
  category: request.category,
  priority: request.priority,
  description: request.description,
  image: request.image,
  status: request.status,
  assignedTech: request.assignedTech,
  reportedBy: request.reportedBy,
  note: request.note,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

const normalizeMaintenanceStatus = (status, fallback = 'InProgress') => {
  const raw = String(status || fallback).trim();
  const normalized = raw.toLowerCase();

  if (normalized === 'open') return 'Open';
  if (['inprogress', 'in progress', 'in_progress'].includes(normalized)) return 'InProgress';
  if (['resolved', 'complete', 'completed'].includes(normalized)) return 'Resolved';
  if (['cancelled', 'canceled'].includes(normalized)) return 'Cancelled';
  return raw;
};

const applyMaintenanceResolvedEffects = async (request, note = '') => {
  const roomNumber = String(request?.room || '').trim();
  if (!roomNumber) return;

  const room = await Room.findOne({ roomName: roomNumber });
  if (room) {
    room.status = 'Dirty';
    room.inspectionStatus = 'Pending';
    await room.save();
  }

  await StaffTask.updateMany(
    {
      room_number: roomNumber,
      staff_type: 'housekeeping',
      status: { $in: ['WaitingMaintenance', 'waitingmaintenance', 'waiting maintenance'] },
    },
    {
      $set: {
        status: 'Cancelled',
      },
    }
  );

  await createCleaningTaskForRoom({
    roomNumber,
    priority: 'medium',
    receptionistNote: note || 'Maintenance completed. Please perform cleaning.',
    cleaningType: 'Post Maintenance Cleaning',
    assignedBy: 'Manager',
    checkoutTime: new Date(),
  });
};

const housekeepingService = {
  async getRooms(query = {}, user) {
    ensureWorkflowRole(user, ['manager', 'housekeeping', 'receptionist']);

    return managerRoomService.getAll(query);
  },

  async getMinibarItems(query = {}, user) {
    ensureWorkflowRole(user, ['manager', 'housekeeping', 'receptionist']);

    const filter = {};
    if (query.stock_status) filter.stock_status = query.stock_status;
    if (query.is_active !== undefined) {
      filter.is_active = String(query.is_active).toLowerCase() === 'true';
    }

    return MinibarItem.find(filter).sort({ createdAt: -1 }).lean();
  },

  async confirmCheckout(body = {}, user) {
    ensureWorkflowRole(user, ['manager', 'receptionist']);
    const roomNumber = String(body.room_number || '').trim();
    const task = await createCleaningTaskForRoom({
      roomNumber,
      priority: body.priority || 'high',
      receptionistNote: body.receptionistNote || body.note || 'Guest checkout confirmed by receptionist',
      guestRequest: body.guestRequest || '',
      cleaningType: body.cleaningType || 'Checkout Cleaning',
      assignedBy: user?.full_name || 'Receptionist',
      checkoutTime: body.checkoutTime,
    });

    const room = await Room.findOne({ roomName: roomNumber }).lean();
    return {
      task: mapTask(task),
      room,
    };
  },

  async getDashboard(user) {
    const role = ensureWorkflowRole(user, ['manager', 'housekeeping', 'receptionist']);

    const [tasks, rooms, serviceRequests, maintenanceRequests] = await Promise.all([
      StaffTask.find({ staff_type: 'housekeeping' }).lean(),
      Room.find({}).lean(),
      CustomerServiceRequest.find({ assigned_department: { $regex: 'housekeeping', $options: 'i' } }).lean(),
      MaintenanceRequest.find({}).lean(),
    ]);

    const visibleTasks = role.includes('housekeeping') ? tasks.filter((task) => canAccessTask(user, task)) : tasks;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const completedToday = visibleTasks.filter((task) => {
      if (!task.completedAt) return false;
      const completedAt = new Date(task.completedAt);
      return completedAt >= today && completedAt < tomorrow;
    }).length;

    const newCleaningRequests = visibleTasks.filter((task) => normalizeTaskStatus(task.status) === 'Assigned').length;
    const acceptedTasks = visibleTasks.filter((task) => normalizeTaskStatus(task.status) === 'Accepted').length;
    const roomsBeingCleaned = visibleTasks.filter((task) => normalizeTaskStatus(task.status) === 'Cleaning').length;
    const waitingMaintenance = visibleTasks.filter((task) => normalizeTaskStatus(task.status) === 'WaitingMaintenance').length;

    const dirtyRooms = rooms.filter((room) => String(room.status).toLowerCase() === 'dirty').length;
    const cleaningRooms = rooms.filter((room) => String(room.status).toLowerCase() === 'cleaning').length;
    const availableRooms = rooms.filter((room) => String(room.status).toLowerCase() === 'available').length;
    const maintenanceRooms = rooms.filter((room) => String(room.status).toLowerCase() === 'maintenance').length;

    const maintenanceOpenCount = maintenanceRequests.filter((request) => ['Open', 'InProgress', 'open', 'inprogress'].includes(String(request.status))).length;

    return {
      newCleaningRequests,
      acceptedTasks,
      roomsBeingCleaned,
      waitingMaintenance,
      completedToday,
      dirtyRooms,
      cleaningRooms,
      availableRooms,
      maintenanceRooms,
      inspectionRequests: 0,
      serviceRequests: serviceRequests.length,
      staffWorkload: visibleTasks.length,
      waitingMaintenanceRequests: maintenanceOpenCount,
    };
  },

  async getTasks(query = {}, user) {
    const role = ensureWorkflowRole(user, ['manager', 'housekeeping', 'receptionist']);

    const filter = { staff_type: 'housekeeping' };
    if (query.status) filter.status = query.status;
    if (query.staff_type) filter.staff_type = query.staff_type;
    if (query.room_number) filter.room_number = query.room_number;
    if (query.assignedBy) filter.assignedBy = query.assignedBy;

    const managerOnly = String(query.manager_assigned_only || '').toLowerCase() === 'true';
    if (managerOnly) {
      filter.assignedBy = { $regex: 'manager', $options: 'i' };
    }

    const tasks = await StaffTask.find(filter).sort({ createdAt: -1 }).lean();
    if (role.includes('housekeeping')) {
      return tasks
        .filter((task) => canAccessTask(user, task))
        .filter((task) => !managerOnly || isManagerAssignedTask(task))
        .map(mapTask);
    }

    return tasks.map(mapTask);
  },

  async createCleaningTask(body = {}, user) {
    ensureWorkflowRole(user, ['manager', 'receptionist']);
    const task = await createCleaningTaskForRoom({
      roomNumber: body.room_number,
      cleaningType: body.cleaningType || 'Checkout Cleaning',
      priority: body.priority || 'medium',
      receptionistNote: body.receptionistNote || '',
      guestRequest: body.guestRequest || '',
      assignedBy: user?.full_name || body.assignedBy || 'Receptionist',
      checkoutTime: body.checkoutTime,
    });
    return mapTask(task);
  },

  async getTaskById(id, user) {
    const task = await StaffTask.findById(id).lean();
    if (!task) throw createHttpError('Task not found', 404);
    if (!canAccessTask(user, task)) throw createHttpError('Forbidden', 403);
    return mapTask(task);
  },

  async startCleaningTask(id, user) {
    const task = await StaffTask.findById(id);
    if (!task) throw createHttpError('Task not found', 404);
    if (!isHousekeepingTask(task)) throw createHttpError('Only housekeeping cleaning task can be started', 400);
    if (!canAccessTask(user, task)) throw createHttpError('Forbidden', 403);
    const currentStatus = normalizeTaskStatus(task.status);
    if (currentStatus !== 'Accepted') {
      throw createHttpError('Task cannot be started from its current status', 409);
    }

    const pendingMaintenance = await MaintenanceRequest.findOne({ room: task.room_number, status: { $in: ['Open', 'InProgress'] } });
    if (pendingMaintenance) {
      throw createHttpError('Task cannot start because maintenance is still in progress', 409);
    }

    const room = await Room.findOne({ roomName: task.room_number });
    if (room) {
      room.status = 'Cleaning';
      room.inspectionStatus = 'Completed';
      await room.save();
    }

    task.status = 'Cleaning';
    task.startedAt = new Date();
    await task.save();
    return mapTask(task);
  },

  async completeCleaningTask(id, user) {
    const task = await StaffTask.findById(id);
    if (!task) throw createHttpError('Task not found', 404);
    if (!isHousekeepingTask(task)) throw createHttpError('Only housekeeping cleaning task can be completed', 400);
    if (!canAccessTask(user, task)) throw createHttpError('Forbidden', 403);
    const currentStatus = normalizeTaskStatus(task.status);
    if (['Completed', 'Cancelled', 'WaitingMaintenance'].includes(currentStatus)) {
      throw createHttpError('Task is already completed or cancelled', 409);
    }

    if (currentStatus !== 'Cleaning') {
      throw createHttpError('Only cleaning tasks in Cleaning status can be completed', 409);
    }

    const pendingMaintenance = await MaintenanceRequest.findOne({ room: task.room_number, status: { $in: ['Open', 'InProgress'] } });
    if (pendingMaintenance) {
      throw createHttpError('Maintenance must be completed before room can be marked available', 409);
    }

    task.status = 'Completed';
    task.completedAt = new Date();
    await task.save();

    const room = await Room.findOne({ roomName: task.room_number });
    if (room) {
      room.status = 'Available';
      room.inspectionStatus = 'Completed';
      await room.save();
    }
    return mapTask(task);
  },

  async updateTaskStatus(id, body = {}, user) {
    const task = await StaffTask.findById(id);
    if (!task) throw createHttpError('Task not found', 404);
    if (!isHousekeepingTask(task)) throw createHttpError('Only housekeeping cleaning task can be updated', 400);
    if (!canAccessTask(user, task)) throw createHttpError('Forbidden', 403);

    const allowedStatuses = ['Assigned', 'Accepted', 'Cleaning', 'WaitingMaintenance', 'Completed', 'Cancelled'];
    const nextStatus = String(body.status || '').trim();
    if (!allowedStatuses.includes(nextStatus)) {
      throw createHttpError('Invalid status', 400);
    }

    const room = await Room.findOne({ roomName: task.room_number });

    if (nextStatus === 'Completed') {
      task.completedAt = new Date();
      if (room) {
        room.status = 'Available';
        room.inspectionStatus = 'Completed';
        await room.save();
      }
    }

    if (nextStatus === 'Cleaning') {
      task.startedAt = task.startedAt || new Date();
      if (room) {
        room.status = 'Cleaning';
        room.inspectionStatus = 'Completed';
        await room.save();
      }
    }

    if (nextStatus === 'Accepted') {
      task.acceptedAt = new Date();
      if (room) {
        room.status = 'Cleaning';
        room.inspectionStatus = 'Completed';
        await room.save();
      }
    }

    if (nextStatus === 'WaitingMaintenance') {
      if (room) {
        room.status = 'Maintenance';
        room.inspectionStatus = 'Completed';
        await room.save();
      }
    }

    if (nextStatus === 'Assigned') {
      if (room) {
        room.status = 'Dirty';
        room.inspectionStatus = 'Pending';
        await room.save();
      }
    }

    if (nextStatus === 'Cancelled') {
      if (room) {
        room.status = 'Dirty';
        room.inspectionStatus = 'Pending';
        await room.save();
      }
    }

    task.status = nextStatus;
    await task.save();
    return mapTask(task);
  },

  async cancelCleaningTask(id, user) {
    const task = await StaffTask.findById(id);
    if (!task) throw createHttpError('Task not found', 404);
    if (!isHousekeepingTask(task)) throw createHttpError('Only housekeeping cleaning task can be cancelled', 400);
    if (!canAccessTask(user, task)) throw createHttpError('Forbidden', 403);
    if (['Completed', 'completed', 'closed', 'Cancelled', 'cancelled'].includes(String(task.status))) {
      throw createHttpError('Task cannot be cancelled from its current status', 409);
    }

    const room = await Room.findOne({ roomName: task.room_number });
    if (room) {
      room.status = 'Dirty';
      room.inspectionStatus = 'Pending';
      await room.save();
    }

    task.status = 'Cancelled';
    await task.save();
    return mapTask(task);
  },

  async getMaintenanceRequests(query = {}, user) {
    ensureWorkflowRole(user, ['manager', 'housekeeping', 'receptionist', 'technical']);

    const filter = {};
    if (query.room) filter.room = query.room;
    if (query.status) filter.status = query.status;

    const requests = await MaintenanceRequest.find(filter).sort({ createdAt: -1 }).lean();
    return requests.map(mapMaintenanceRequest);
  },

  async getMaintenanceRequestById(id, user) {
    ensureWorkflowRole(user, ['manager', 'housekeeping', 'receptionist', 'technical']);

    const request = await MaintenanceRequest.findById(id).lean();
    if (!request) throw createHttpError('Maintenance request not found', 404);
    return mapMaintenanceRequest(request);
  },

  async assignMaintenanceRequest(id, body = {}, user) {
    ensureWorkflowRole(user, ['manager']);

    const request = await MaintenanceRequest.findById(id);
    if (!request) throw createHttpError('Maintenance request not found', 404);

    request.assignedTech = String(body.assignedTech || request.assignedTech || 'Technical Team');
    request.status = body.status || 'InProgress';
    if (body.note !== undefined) request.note = body.note;
    if (body.image !== undefined) request.image = body.image;
    await request.save();
    return mapMaintenanceRequest(request);
  },

  async updateMaintenanceRequestStatus(id, body = {}, user) {
    const role = ensureWorkflowRole(user, ['manager', 'technical']);

    const request = await MaintenanceRequest.findById(id);
    if (!request) throw createHttpError('Maintenance request not found', 404);

    const currentStatus = normalizeMaintenanceStatus(request.status, 'Open');
    const nextStatus = normalizeMaintenanceStatus(body.status || request.status || 'InProgress');
    const allowedStatuses = ['Open', 'InProgress', 'Resolved', 'Cancelled'];
    if (!allowedStatuses.includes(nextStatus)) {
      throw createHttpError('Invalid maintenance status', 400);
    }

    if (role.includes('technical') && !['InProgress', 'Resolved'].includes(nextStatus)) {
      throw createHttpError('Technical staff can only move maintenance to InProgress or Resolved', 403);
    }

    request.status = nextStatus;
    if (body.note !== undefined) request.note = body.note;
    if (body.image !== undefined) request.image = body.image;

    if (nextStatus === 'Resolved' && currentStatus !== 'Resolved') {
      await applyMaintenanceResolvedEffects(request, body.note);
    }

    await request.save();
    return mapMaintenanceRequest(request);
  },

  async approveMaintenanceRequest(id, body = {}, user) {
    ensureWorkflowRole(user, ['manager']);
    return this.completeMaintenanceRequest(id, body, user);
  },

  async rejectMaintenanceRequest(id, body = {}, user) {
    ensureWorkflowRole(user, ['manager']);

    const request = await MaintenanceRequest.findById(id);
    if (!request) throw createHttpError('Maintenance request not found', 404);

    request.status = 'InProgress';
    if (body.note !== undefined) request.note = body.note;

    const room = await Room.findOne({ roomName: request.room });
    if (room) {
      room.status = 'Dirty';
      room.inspectionStatus = 'Pending';
      await room.save();
    }

    await request.save();
    return mapMaintenanceRequest(request);
  },

  async completeMaintenanceRequest(id, body = {}, user) {
    ensureWorkflowRole(user, ['manager']);

    const request = await MaintenanceRequest.findById(id);
    if (!request) throw createHttpError('Maintenance request not found', 404);

    request.status = 'Resolved';
    if (body.note !== undefined) request.note = body.note;
    if (body.image !== undefined) request.image = body.image;

    await applyMaintenanceResolvedEffects(request, body.note);

    await request.save();
    return mapMaintenanceRequest(request);
  },

  async getServiceRequests(query = {}, user) {
    const role = normalizeRole(user);
    if (!role.includes('manager') && !role.includes('housekeeping') && !role.includes('receptionist')) {
      throw createHttpError('Forbidden', 403);
    }

    const filter = {
      $or: [
        { assigned_department: { $regex: 'housekeeping', $options: 'i' } },
        { service_category: { $regex: 'housekeeping', $options: 'i' } },
        { assigned_to: { $regex: 'housekeeping', $options: 'i' } },
      ],
    };
    if (query.status) filter.status = validateServiceRequestStatus(query.status);
    if (query.room_number) filter.room_number = query.room_number;

    const requests = await CustomerServiceRequest.find(filter).sort({ createdAt: -1 }).lean();
    if (role.includes('housekeeping')) {
      return requests.filter((request) => canAccessServiceRequest(user, request)).map(mapServiceRequest);
    }

    return requests.map(mapServiceRequest);
  },

  async getInspections(query = {}, user) {
    const role = normalizeRole(user);
    if (!role.includes('manager') && !role.includes('housekeeping') && !role.includes('receptionist')) {
      throw createHttpError('Forbidden', 403);
    }

    const filter = {};
    if (query.room_number) filter.room_number = query.room_number;
    if (query.status) filter.status = query.status;

    const inspections = await Inspection.find(filter).sort({ createdAt: -1 }).lean();
    return inspections.map(mapInspection);
  },

  async getInspectionById(id, user) {
    const role = normalizeRole(user);
    if (!role.includes('manager') && !role.includes('housekeeping') && !role.includes('receptionist')) {
      throw createHttpError('Forbidden', 403);
    }

    const inspection = await Inspection.findById(id).lean();
    if (!inspection) throw createHttpError('Inspection not found', 404);
    return mapInspection(inspection);
  },

  async getServiceRequestById(id, user) {
    const request = await CustomerServiceRequest.findById(id).lean();
    if (!request) throw createHttpError('Service request not found', 404);
    const role = normalizeRole(user);
    if (!role.includes('manager') && !role.includes('housekeeping')) {
      throw createHttpError('Forbidden', 403);
    }
    if (!isHousekeepingAssignedRequest(request)) {
      throw createHttpError('Service request is not assigned to housekeeping', 403);
    }
    if (!canAccessServiceRequest(user, request)) {
      throw createHttpError('Forbidden', 403);
    }
    return mapServiceRequest(request);
  },

  async acceptServiceRequest(id, body = {}, user) {
    const request = await CustomerServiceRequest.findById(id);
    if (!request) throw createHttpError('Service request not found', 404);
    const role = normalizeRole(user);
    if (!role.includes('manager') && !role.includes('housekeeping')) {
      throw createHttpError('Forbidden', 403);
    }
    if (!isHousekeepingAssignedRequest(request)) {
      throw createHttpError('Service request is not assigned to housekeeping', 403);
    }
    if (!canAccessServiceRequest(user, request)) {
      throw createHttpError('Forbidden', 403);
    }

    if (body.internal_note !== undefined) {
      request.internal_note = String(body.internal_note || '').trim();
    }

    updateServiceRequestLifecycle(request, 'accepted', user);
    await request.save();
    return mapServiceRequest(request);
  },

  async startServiceRequest(id, user) {
    const request = await CustomerServiceRequest.findById(id);
    if (!request) throw createHttpError('Service request not found', 404);
    const role = normalizeRole(user);
    if (!role.includes('manager') && !role.includes('housekeeping')) {
      throw createHttpError('Forbidden', 403);
    }
    if (!isHousekeepingAssignedRequest(request)) {
      throw createHttpError('Service request is not assigned to housekeeping', 403);
    }
    if (!canAccessServiceRequest(user, request)) {
      throw createHttpError('Forbidden', 403);
    }

    updateServiceRequestLifecycle(request, 'in_progress', user);
    await request.save();
    return mapServiceRequest(request);
  },

  async completeServiceRequest(id, user) {
    const request = await CustomerServiceRequest.findById(id);
    if (!request) throw createHttpError('Service request not found', 404);
    const role = normalizeRole(user);
    if (!role.includes('manager') && !role.includes('housekeeping')) {
      throw createHttpError('Forbidden', 403);
    }
    if (!isHousekeepingAssignedRequest(request)) {
      throw createHttpError('Service request is not assigned to housekeeping', 403);
    }
    if (!canAccessServiceRequest(user, request)) {
      throw createHttpError('Forbidden', 403);
    }

    updateServiceRequestLifecycle(request, 'handled', user);
    await request.save();
    return mapServiceRequest(request);
  },

  async cancelServiceRequest(id, body = {}, user) {
    const request = await CustomerServiceRequest.findById(id);
    if (!request) throw createHttpError('Service request not found', 404);
    const role = normalizeRole(user);
    if (!role.includes('manager') && !role.includes('housekeeping')) {
      throw createHttpError('Forbidden', 403);
    }
    if (!isHousekeepingAssignedRequest(request)) {
      throw createHttpError('Service request is not assigned to housekeeping', 403);
    }
    if (!canAccessServiceRequest(user, request)) {
      throw createHttpError('Forbidden', 403);
    }

    if (body.internal_note !== undefined) {
      request.internal_note = String(body.internal_note || '').trim();
    }
    if (body.note !== undefined) {
      request.note = String(body.note || '').trim();
    }

    updateServiceRequestLifecycle(request, 'canceled', user);
    await request.save();
    return mapServiceRequest(request);
  },

  async updateServiceRequest(id, body = {}, user) {
    const request = await CustomerServiceRequest.findById(id);
    if (!request) throw createHttpError('Service request not found', 404);
    const role = normalizeRole(user);
    if (!role.includes('manager') && !role.includes('housekeeping')) {
      throw createHttpError('Forbidden', 403);
    }
    if (!isHousekeepingAssignedRequest(request)) {
      throw createHttpError('Service request is not assigned to housekeeping', 403);
    }
    if (!canAccessServiceRequest(user, request)) {
      throw createHttpError('Forbidden', 403);
    }

    if (body.internal_note !== undefined) {
      request.internal_note = String(body.internal_note || '').trim();
    }

    if (body.note !== undefined) {
      request.note = String(body.note || '').trim();
    }

    if (body.status !== undefined) {
      updateServiceRequestLifecycle(request, body.status, user);
    }

    await request.save();
    return mapServiceRequest(request);
  },

  async unableToCompleteServiceRequest(id, body = {}, user) {
    return this.cancelServiceRequest(id, body, user);
  },

  async createInspection(body = {}, user) {
    const role = normalizeRole(user);
    if (!role.includes('manager') && !role.includes('housekeeping') && !role.includes('receptionist')) {
      throw createHttpError('Forbidden', 403);
    }

    const {
      task_id = null,
      room_number,
      room = '',
      guest = '',
      checklist = {},
      damage = [],
      lostItem = [],
      minibar = [],
      photos = [],
      note = '',
      remarks = '',
      minibar_used = false,
      missing_items = [],
      damaged_items = [],
      maintenance_required = false,
      room_status_before = '',
      room_status_after = 'Cleaning',
    } = body;

    if (!room_number) throw createHttpError('Room number is required', 400);

    const roomRecord = await Room.findOne({ roomName: room_number });
    const sourceTask = task_id ? await StaffTask.findById(task_id) : null;
    const isInspectionReviewTask = Boolean(
      sourceTask
      && String(sourceTask.staff_type || '').trim().toLowerCase() === 'housekeeping'
      && String(sourceTask.cleaningType || '').trim().toLowerCase() === 'inspection review'
    );
    let task = null;
    let invoiceItems = [];
    let minibarTotal = 0;

    if (minibar_used || minibar.length) {
      const minibarItems = await MinibarItem.find({ is_active: true }).lean();
      const minibarItemById = new Map(minibarItems.map((item) => [String(item._id), item]));
      const minibarItemByName = new Map(minibarItems.map((item) => [String(item.name).toLowerCase(), item]));

      const selectedItems = minibar.length ? minibar : [];
      const resolvedItems = selectedItems.map((entry) => {
        const qty = Math.max(1, Number(entry.qty || 1));
        const dbItem = minibarItemById.get(String(entry.item_id || entry.itemId || entry._id || ''))
          || minibarItemByName.get(String(entry.item || entry.name || '').toLowerCase())
          || null;
        const itemName = dbItem?.name || entry.item || entry.name || 'Minibar item';
        const unitPrice = Number(dbItem?.price ?? entry.price ?? 0);
        const total = qty * unitPrice;
        minibarTotal += total;
        return {
          item_id: dbItem?._id || entry.item_id || entry.itemId || null,
          item: itemName,
          qty,
          price: unitPrice,
          total,
        };
      });

      invoiceItems = resolvedItems.map((entry) => ({
        name: entry.item,
        quantity: entry.qty,
        unit_price: entry.price,
        total: entry.total,
        note: 'Minibar usage recorded during inspection',
      }));

      // Deduct quantity from the physical room's minibar stock
      if (roomRecord) {
        if (!roomRecord.minibar) roomRecord.minibar = [];
        const currentMinibar = [...roomRecord.minibar];

        for (const entry of resolvedItems) {
          const dbItemIdStr = String(entry.item_id || '');
          const qtyUsed = entry.qty || 1;
          if (!dbItemIdStr) {
            continue;
          }

          const itemIndex = currentMinibar.findIndex((m) => m.item_id?.toString() === dbItemIdStr);

          if (itemIndex > -1) {
            currentMinibar[itemIndex].quantity = Math.max(0, (currentMinibar[itemIndex].quantity || 0) - qtyUsed);
          } else {
            // Default room stocking quantity to 5, minus consumed qty
            currentMinibar.push({
              item_id: entry.item_id,
              quantity: Math.max(0, 5 - qtyUsed)
            });
          }
        }
        roomRecord.minibar = currentMinibar;
      }
    }

    if (roomRecord) {
      roomRecord.status = maintenance_required || damaged_items.length || damage.length ? 'Maintenance' : 'Dirty';
      roomRecord.inspectionStatus = 'Completed';
      roomRecord.currentGuest = guest || roomRecord.currentGuest || '';
      await roomRecord.save();
    }

    if (maintenance_required || damaged_items.length || damage.length) {
      task = await StaffTask.create({
        title: `Maintenance required for room ${room_number}`,
        description: remarks || 'Damage detected during inspection',
        staff_type: 'technical',
        assigned_staff_id: null,
        assigned_to: 'Technical Team',
        room_number,
        priority: 'high',
        status: 'Assigned',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        assignedBy: 'Receptionist',
        receptionistNote: note || remarks || 'Maintenance required',
      });
    } else if (!isInspectionReviewTask) {
      task = await StaffTask.create({
        title: `Cleaning required for room ${room_number}`,
        description: remarks || 'Room needs cleaning after inspection',
        staff_type: 'housekeeping',
        assigned_staff_id: null,
        assigned_to: 'Housekeeping Team',
        room_number,
        priority: 'medium',
        status: 'Assigned',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        assignedBy: 'Receptionist',
        receptionistNote: note || remarks || 'Ready for cleaning',
        cleaningType: 'Checkout Cleaning',
      });
    } else if (sourceTask) {
      sourceTask.status = 'Completed';
      sourceTask.completedAt = new Date();
      await sourceTask.save();
      task = sourceTask;
    }

    const inspection = await Inspection.create({
      room_number,
      room: room || room_number,
      guest,
      checklist,
      damage,
      lostItem,
      minibar,
      photos,
      note,
      inspected_by: user?._id || null,
      inspector_name: user?.full_name || 'System',
      status: 'submitted',
      remarks,
      minibar_used: minibar_used || minibar.length > 0,
      minibar_total: minibarTotal,
      invoice_items: invoiceItems,
      missing_items: missing_items || [],
      damaged_items: damaged_items || [],
      maintenance_required: maintenance_required || damaged_items.length > 0 || damage.length > 0,
      task_id: sourceTask?._id || task?._id || null,
      room_status_before,
      room_status_after,
    });

    return {
      inspection: mapInspection(inspection),
      task: mapTask(task),
    };
  },

  async reportRoomIssue(body = {}, user) {
    ensureWorkflowRole(user, ['housekeeping', 'manager']);

    const room_number = normalizeMaintenanceValue(body.room_number);
    const task_id = normalizeMaintenanceValue(body.task_id);
    const category = normalizeMaintenanceValue(body.category);
    const description = normalizeMaintenanceValue(body.description);
    const priority = normalizeMaintenanceValue(body.priority) || 'high';
    const image = normalizeMaintenanceValue(body.image);
    const note = normalizeMaintenanceValue(body.note);
    const reportedBy = normalizeMaintenanceValue(body.reportedBy) || 'Housekeeping';

    if (!room_number || !category || !description) {
      throw createHttpError('Room number, category and description are required', 400);
    }

    const room = await Room.findOne({ roomName: room_number });
    if (room) {
      room.status = 'Maintenance';
      room.inspectionStatus = 'Completed';
      await room.save();
    }

    const duplicateRequest = await MaintenanceRequest.findOne({
      room: room_number,
      category,
      description,
      status: { $in: ['Open', 'InProgress'] },
    }).sort({ createdAt: -1 });

    if (duplicateRequest) {
      const taskQuery = task_id
        ? { _id: task_id, room_number, staff_type: 'housekeeping' }
        : { room_number, staff_type: 'housekeeping', status: { $nin: ['Completed', 'Cancelled'] } };

      const task = await StaffTask.findOne(taskQuery).sort({ createdAt: -1 });
      if (task) {
        task.status = 'WaitingMaintenance';
        await task.save();
      }

      return {
        task: task ? mapTask(task) : null,
        maintenanceRequest: mapMaintenanceRequest(duplicateRequest),
        duplicate: true,
      };
    }

    const maintenanceRequest = await MaintenanceRequest.create({
      room: room_number,
      category,
      priority,
      description,
      image,
      status: 'Open',
      assignedTech: 'Technical Team',
      reportedBy,
      note,
    });

    const taskQuery = task_id
      ? { _id: task_id, room_number, staff_type: 'housekeeping' }
      : { room_number, staff_type: 'housekeeping', status: { $nin: ['Completed', 'Cancelled'] } };

    const task = await StaffTask.findOne(taskQuery).sort({ createdAt: -1 });
    if (task) {
      task.status = 'WaitingMaintenance';
      await task.save();
    }

    return {
      task: task ? mapTask(task) : null,
      maintenanceRequest: mapMaintenanceRequest(maintenanceRequest),
    };
  },

  async acceptCleaningTask(id, user) {
    const task = await StaffTask.findById(id);
    if (!task) throw createHttpError('Task not found', 404);
    if (!isHousekeepingTask(task)) throw createHttpError('Only housekeeping cleaning task can be accepted', 400);
    if (!canAccessTask(user, task)) throw createHttpError('Forbidden', 403);

    const currentStatus = normalizeTaskStatus(task.status);
    if (!['Assigned', 'Accepted'].includes(currentStatus)) {
      throw createHttpError('Only assigned task can be accepted', 409);
    }

    const pendingMaintenance = await MaintenanceRequest.findOne({ room: task.room_number, status: { $in: ['Open', 'InProgress'] } });
    if (pendingMaintenance) {
      throw createHttpError('Task cannot be accepted because maintenance is still in progress', 409);
    }

    const room = await Room.findOne({ roomName: task.room_number });
    if (room) {
      room.status = 'Dirty';
      room.inspectionStatus = 'Pending';
      await room.save();
    }
    task.status = 'Accepted';
    task.acceptedAt = new Date();
    await task.save();
    return mapTask(task);
  },

  async getInspectionByRoom(roomId, user) {
    const role = normalizeRole(user);
    if (!role.includes('manager') && !role.includes('housekeeping') && !role.includes('receptionist')) {
      throw createHttpError('Forbidden', 403);
    }

    const roomNumber = String(roomId || '').trim();
    if (!roomNumber) {
      throw createHttpError('Room number is required', 400);
    }

    if (!/^[A-Za-z0-9-]+$/.test(roomNumber)) {
      throw createHttpError('Invalid room number format', 400);
    }

    const inspection = await Inspection.findOne({ room_number: roomNumber }).sort({ createdAt: -1 }).lean();
    if (!inspection) throw createHttpError('Inspection not found', 404);
    return mapInspection(inspection);
  },

  async updateInspection(id, body = {}, user) {
    const role = normalizeRole(user);
    if (!role.includes('manager') && !role.includes('housekeeping') && !role.includes('receptionist')) {
      throw createHttpError('Forbidden', 403);
    }
    const inspection = await Inspection.findById(id);
    if (!inspection) throw createHttpError('Inspection not found', 404);

    if (body.checklist) inspection.checklist = { ...inspection.checklist, ...body.checklist };
    if (body.remarks !== undefined) inspection.remarks = body.remarks;
    if (body.note !== undefined) inspection.note = body.note;
    if (body.status !== undefined) inspection.status = body.status;
    if (body.damage !== undefined) inspection.damage = body.damage;
    if (body.lostItem !== undefined) inspection.lostItem = body.lostItem;
    if (body.photos !== undefined) inspection.photos = body.photos;

    await inspection.save();
    return mapInspection(inspection);
  },
};

module.exports = housekeepingService;
