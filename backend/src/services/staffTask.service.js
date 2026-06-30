const StaffTask = require('../models/staffTask.model');

const listStaffTasks = (filter = {}) => StaffTask.find(filter).sort({ createdAt: -1 });

const createStaffTask = (payload) => StaffTask.create(payload);

const updateStaffTask = (staffTaskId, payload) =>
  StaffTask.findByIdAndUpdate(staffTaskId, payload, { new: true, runValidators: true });

const closeStaffTask = (staffTaskId) =>
  StaffTask.findByIdAndUpdate(
    staffTaskId,
    { status: 'closed', closed_at: new Date() },
    { new: true, runValidators: true }
  );

const cancelStaffTask = (staffTaskId) =>
  StaffTask.findByIdAndUpdate(
    staffTaskId,
    { status: 'cancelled', cancelled_at: new Date() },
    { new: true, runValidators: true }
  );

module.exports = {
  cancelStaffTask,
  closeStaffTask,
  createStaffTask,
  listStaffTasks,
  updateStaffTask
};
