const staffTaskService = require('./staff-task.service');

const sendError = (res, err) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

const staffTaskController = {
  async getStaffMembers(req, res) {
    try {
      const data = await staffTaskService.getStaffMembers();
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getStaffTasks(req, res) {
    try {
      const data = await staffTaskService.getStaffTasks(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async createStaffTask(req, res) {
    try {
      const data = await staffTaskService.createStaffTask(req.body, req.user);
      res.status(201).json({ success: true, data, message: 'Staff task created successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async updateStaffTask(req, res) {
    try {
      const data = await staffTaskService.updateStaffTask(req.params.taskId, req.body, req.user);
      res.status(200).json({ success: true, data, message: 'Staff task updated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async closeStaffTask(req, res) {
    try {
      const data = await staffTaskService.closeStaffTask(req.params.taskId);
      res.status(200).json({ success: true, data, message: 'Staff task closed successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async cancelStaffTask(req, res) {
    try {
      const data = await staffTaskService.cancelStaffTask(req.params.taskId);
      res.status(200).json({ success: true, data, message: 'Staff task canceled successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },
};

module.exports = staffTaskController;
