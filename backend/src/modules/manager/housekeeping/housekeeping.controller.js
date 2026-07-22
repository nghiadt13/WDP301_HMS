const housekeepingService = require('./housekeeping.service');

const sendError = (res, err) => {
  const status = err?.statusCode || err?.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

const housekeepingController = {
  async getRooms(req, res) {
    try {
      const data = await housekeepingService.getRooms(req.query, req.user);
      res.status(200).json({ success: true, ...data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getRoomInventoryItems(req, res) {
    try {
      const data = await housekeepingService.getRoomInventoryItems(req.query, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async confirmCheckout(req, res) {
    try {
      const data = await housekeepingService.confirmCheckout(req.body, req.user);
      res.status(201).json({ success: true, data, message: 'Checkout confirmed and cleaning task created' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getDashboard(req, res) {
    try {
      const data = await housekeepingService.getDashboard(req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getTasks(req, res) {
    try {
      const data = await housekeepingService.getTasks(req.query, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async createCleaningTask(req, res) {
    try {
      const data = await housekeepingService.createCleaningTask(req.body, req.user);
      res.status(201).json({ success: true, data, message: 'Cleaning task created successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getTaskById(req, res) {
    try {
      const data = await housekeepingService.getTaskById(req.params.id, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async acceptCleaningTask(req, res) {
    try {
      const data = await housekeepingService.acceptCleaningTask(req.params.id, req.user);
      res.status(200).json({ success: true, data, message: 'Cleaning task accepted successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async startCleaningTask(req, res) {
    try {
      const data = await housekeepingService.startCleaningTask(req.params.id, req.user);
      res.status(200).json({ success: true, data, message: 'Cleaning task started successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async completeCleaningTask(req, res) {
    try {
      const data = await housekeepingService.completeCleaningTask(req.params.id, req.user, req.body);
      res.status(200).json({ success: true, data, message: 'Cleaning task completed successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async updateTaskStatus(req, res) {
    try {
      const data = await housekeepingService.updateTaskStatus(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data, message: 'Task status updated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async cancelCleaningTask(req, res) {
    try {
      const data = await housekeepingService.cancelCleaningTask(req.params.id, req.user);
      res.status(200).json({ success: true, data, message: 'Task cancelled successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getServiceRequests(req, res) {
    try {
      const data = await housekeepingService.getServiceRequests(req.query, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getServiceRequestById(req, res) {
    try {
      const data = await housekeepingService.getServiceRequestById(req.params.id, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async acceptServiceRequest(req, res) {
    try {
      const data = await housekeepingService.acceptServiceRequest(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data, message: 'Service request accepted successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async startServiceRequest(req, res) {
    try {
      const data = await housekeepingService.startServiceRequest(req.params.id, req.user);
      res.status(200).json({ success: true, data, message: 'Service request started successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async completeServiceRequest(req, res) {
    try {
      const data = await housekeepingService.completeServiceRequest(req.params.id, req.user);
      res.status(200).json({ success: true, data, message: 'Service request completed successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async cancelServiceRequest(req, res) {
    try {
      const data = await housekeepingService.cancelServiceRequest(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data, message: 'Service request cancelled successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async updateServiceRequest(req, res) {
    try {
      const data = await housekeepingService.updateServiceRequest(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data, message: 'Service request updated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async unableToCompleteServiceRequest(req, res) {
    try {
      const data = await housekeepingService.unableToCompleteServiceRequest(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data, message: 'Service request marked unable to complete' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getInspections(req, res) {
    try {
      const data = await housekeepingService.getInspections(req.query, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getInspectionById(req, res) {
    try {
      const data = await housekeepingService.getInspectionById(req.params.id, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getInspectionByRoom(req, res) {
    try {
      const data = await housekeepingService.getInspectionByRoom(req.params.roomNumber || req.params.roomId, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async createInspection(req, res) {
    try {
      const data = await housekeepingService.createInspection(req.body, req.user);
      res.status(201).json({ success: true, data, message: 'Inspection saved successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async updateInspection(req, res) {
    try {
      const data = await housekeepingService.updateInspection(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data, message: 'Inspection updated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async reportRoomIssue(req, res) {
    try {
      const data = await housekeepingService.reportRoomIssue(req.body, req.user);
      res.status(201).json({ success: true, data, message: 'Room issue reported successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getMaintenanceRequests(req, res) {
    try {
      const data = await housekeepingService.getMaintenanceRequests(req.query, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getMaintenanceRequestById(req, res) {
    try {
      const data = await housekeepingService.getMaintenanceRequestById(req.params.id, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async assignMaintenanceRequest(req, res) {
    try {
      const data = await housekeepingService.assignMaintenanceRequest(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data, message: 'Maintenance request assigned successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async updateMaintenanceRequestStatus(req, res) {
    try {
      const data = await housekeepingService.updateMaintenanceRequestStatus(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data, message: 'Maintenance request updated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async approveMaintenanceRequest(req, res) {
    try {
      const data = await housekeepingService.approveMaintenanceRequest(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data, message: 'Maintenance request approved successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async rejectMaintenanceRequest(req, res) {
    try {
      const data = await housekeepingService.rejectMaintenanceRequest(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data, message: 'Maintenance request rejected successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async completeMaintenanceRequest(req, res) {
    try {
      const data = await housekeepingService.completeMaintenanceRequest(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data, message: 'Maintenance request completed successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },
};

module.exports = housekeepingController;
