const managerService = require('../services/manager.service');

const sendError = (res, err) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

const managerController = {
  async getStaffMembers(req, res) {
    try {
      const data = await managerService.getStaffMembers();
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getStaffTasks(req, res) {
    try {
      const data = await managerService.getStaffTasks(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async createStaffTask(req, res) {
    try {
      const data = await managerService.createStaffTask(req.body);
      res.status(201).json({ success: true, data, message: 'Staff task created successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async updateStaffTask(req, res) {
    try {
      const data = await managerService.updateStaffTask(req.params.taskId, req.body);
      res.status(200).json({ success: true, data, message: 'Staff task updated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async closeStaffTask(req, res) {
    try {
      const data = await managerService.closeStaffTask(req.params.taskId);
      res.status(200).json({ success: true, data, message: 'Staff task closed successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async cancelStaffTask(req, res) {
    try {
      const data = await managerService.cancelStaffTask(req.params.taskId);
      res.status(200).json({ success: true, data, message: 'Staff task canceled successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getMinibarItems(req, res) {
    try {
      const data = await managerService.getMinibarItems(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async createMinibarItem(req, res) {
    try {
      const data = await managerService.createMinibarItem(req.body);
      res.status(201).json({ success: true, data, message: 'Minibar item created successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async updateMinibarItem(req, res) {
    try {
      const data = await managerService.updateMinibarItem(req.params.itemId, req.body);
      res.status(200).json({ success: true, data, message: 'Minibar item updated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async deactivateMinibarItem(req, res) {
    try {
      const data = await managerService.deactivateMinibarItem(req.params.itemId);
      res.status(200).json({ success: true, data, message: 'Minibar item deactivated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async activateMinibarItem(req, res) {
    try {
      const data = await managerService.activateMinibarItem(req.params.itemId);
      res.status(200).json({ success: true, data, message: 'Minibar item activated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getCustomerFeedbacks(req, res) {
    try {
      const data = await managerService.getCustomerFeedbacks(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async respondCustomerFeedback(req, res) {
    try {
      const data = await managerService.respondCustomerFeedback(req.params.feedbackId, req.body.responseText, req.user);
      res.status(200).json({ success: true, data, message: 'Feedback response sent successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async archiveCustomerFeedback(req, res) {
    try {
      const data = await managerService.archiveCustomerFeedback(req.params.feedbackId);
      res.status(200).json({ success: true, data, message: 'Feedback archived successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },
};

module.exports = managerController;
