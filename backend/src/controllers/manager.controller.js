const customerFeedbackService = require('../services/customerFeedback.service');
const minibarItemService = require('../services/minibarItem.service');
const staffMemberService = require('../services/staffMember.service');
const staffTaskService = require('../services/staffTask.service');

const createHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const pickFields = (source, allowedFields) =>
  allowedFields.reduce((result, field) => {
    if (source[field] !== undefined) {
      result[field] = source[field];
    }

    return result;
  }, {});

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
};

const isValidRoomNumber = (roomNumber) => /^[1-9][0-9]{2,3}$/.test(String(roomNumber || '').trim());

const validateStaffTaskPayload = async (payload, { partial = false } = {}) => {
  if (!partial || payload.title !== undefined) {
    if (!String(payload.title || '').trim()) {
      throw createHttpError('Task title is required.');
    }
  }

  if (!partial || payload.assigned_staff_id !== undefined) {
    if (!payload.assigned_staff_id) {
      throw createHttpError('Assigned staff is required.');
    }

    const staffMember = await staffMemberService.getStaffMemberById(payload.assigned_staff_id);

    if (!staffMember || !staffMember.is_active) {
      throw createHttpError('Assigned staff member was not found.');
    }

    if (payload.staff_type && staffMember.role !== payload.staff_type) {
      throw createHttpError('Assigned staff role does not match selected staff type.');
    }

    payload.assigned_to = staffMember.full_name;
  }

  if (!partial || payload.room_number !== undefined) {
    if (!String(payload.room_number || '').trim()) {
      throw createHttpError('Room number is required.');
    }

    if (!isValidRoomNumber(payload.room_number)) {
      throw createHttpError('Room number must be 3 to 4 digits and cannot start with 0.');
    }

    payload.room_number = String(payload.room_number).trim();
  }

  if (!partial || payload.deadline !== undefined) {
    if (!payload.deadline) {
      throw createHttpError('Deadline is required.');
    }

    const deadline = new Date(payload.deadline);

    if (Number.isNaN(deadline.getTime())) {
      throw createHttpError('Deadline is invalid.');
    }

    deadline.setHours(0, 0, 0, 0);

    if (deadline < startOfToday()) {
      throw createHttpError('Deadline must be today or a future date.');
    }
  }

  return payload;
};

const buildStaffTaskFilter = (query) => {
  const filter = {};

  if (query.staff_type) {
    filter.staff_type = query.staff_type;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  return filter;
};

const buildMinibarFilter = (query) => {
  const filter = {};

  if (query.category) {
    filter.category = new RegExp(query.category, 'i');
  }

  if (query.stock_status) {
    filter.stock_status = query.stock_status;
  }

  return filter;
};

const listStaffMembers = asyncHandler(async (req, res) => {
  const staffMembers = await staffMemberService.listStaffMembers(req.query);

  res.send({ staffMembers });
});

const listStaffTasks = asyncHandler(async (req, res) => {
  const staffTasks = await staffTaskService.listStaffTasks(buildStaffTaskFilter(req.query));

  res.send({ staffTasks });
});

const createStaffTask = asyncHandler(async (req, res) => {
  const payload = pickFields(req.body, [
    'title',
    'description',
    'staff_type',
    'assigned_staff_id',
    'room_number',
    'priority',
    'deadline',
    'status'
  ]);

  await validateStaffTaskPayload(payload);
  payload.status = payload.status || 'assigned';

  const staffTask = await staffTaskService.createStaffTask(payload);

  res.status(201).send({ message: 'Staff task created successfully.', staffTask });
});

const updateStaffTask = asyncHandler(async (req, res) => {
  const payload = pickFields(req.body, [
    'title',
    'description',
    'staff_type',
    'assigned_staff_id',
    'room_number',
    'priority',
    'deadline',
    'status'
  ]);

  await validateStaffTaskPayload(payload, { partial: true });

  const staffTask = await staffTaskService.updateStaffTask(req.params.staffTaskId, payload);

  if (!staffTask) {
    throw createHttpError('Staff task not found.', 404);
  }

  res.send({ message: 'Staff task updated successfully.', staffTask });
});

const closeStaffTask = asyncHandler(async (req, res) => {
  const staffTask = await staffTaskService.closeStaffTask(req.params.staffTaskId);

  if (!staffTask) {
    throw createHttpError('Staff task not found.', 404);
  }

  res.send({ message: 'Staff task closed successfully.', staffTask });
});

const cancelStaffTask = asyncHandler(async (req, res) => {
  const staffTask = await staffTaskService.cancelStaffTask(req.params.staffTaskId);

  if (!staffTask) {
    throw createHttpError('Staff task not found.', 404);
  }

  res.send({ message: 'Staff task cancelled successfully.', staffTask });
});

const listMinibarItems = asyncHandler(async (req, res) => {
  const minibarItems = await minibarItemService.listMinibarItems(buildMinibarFilter(req.query));

  res.send({ minibarItems });
});

const createMinibarItem = asyncHandler(async (req, res) => {
  const payload = pickFields(req.body, ['name', 'category', 'price', 'stock_status', 'description', 'image_url']);

  if (!String(payload.name || '').trim()) {
    throw createHttpError('Item name is required.');
  }

  if (!String(payload.category || '').trim()) {
    throw createHttpError('Category is required.');
  }

  if (payload.price === undefined || Number(payload.price) < 0) {
    throw createHttpError('Price must be greater than or equal to 0.');
  }

  const minibarItem = await minibarItemService.createMinibarItem(payload);

  res.status(201).send({ message: 'Minibar item created successfully.', minibarItem });
});

const updateMinibarItem = asyncHandler(async (req, res) => {
  const payload = pickFields(req.body, ['name', 'category', 'price', 'stock_status', 'description', 'image_url']);

  const minibarItem = await minibarItemService.updateMinibarItem(req.params.minibarItemId, payload);

  if (!minibarItem) {
    throw createHttpError('Minibar item not found.', 404);
  }

  res.send({ message: 'Minibar item updated successfully.', minibarItem });
});

const deactivateMinibarItem = asyncHandler(async (req, res) => {
  const minibarItem = await minibarItemService.deactivateMinibarItem(req.params.minibarItemId);

  if (!minibarItem) {
    throw createHttpError('Minibar item not found.', 404);
  }

  res.send({ message: 'Minibar item deactivated successfully.', minibarItem });
});

const listCustomerFeedbacks = asyncHandler(async (req, res) => {
  const feedbacks = await customerFeedbackService.listCustomerFeedbacks(req.query);

  res.send({ feedbacks });
});

const respondCustomerFeedback = asyncHandler(async (req, res) => {
  const responseText = String(req.body.response_text || '').trim();

  if (!responseText) {
    throw createHttpError('Response text is required.');
  }

  const feedback = await customerFeedbackService.respondCustomerFeedback(req.params.feedbackId, responseText);

  if (!feedback) {
    throw createHttpError('Customer feedback not found.', 404);
  }

  res.send({ message: 'Customer feedback responded successfully.', feedback });
});

const archiveCustomerFeedback = asyncHandler(async (req, res) => {
  const feedback = await customerFeedbackService.archiveCustomerFeedback(req.params.feedbackId);

  if (!feedback) {
    throw createHttpError('Customer feedback not found.', 404);
  }

  res.send({ message: 'Customer feedback archived successfully.', feedback });
});

module.exports = {
  archiveCustomerFeedback,
  cancelStaffTask,
  closeStaffTask,
  createMinibarItem,
  createStaffTask,
  deactivateMinibarItem,
  listCustomerFeedbacks,
  listMinibarItems,
  listStaffMembers,
  listStaffTasks,
  respondCustomerFeedback,
  updateMinibarItem,
  updateStaffTask
};
