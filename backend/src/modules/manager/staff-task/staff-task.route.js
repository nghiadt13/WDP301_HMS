const express = require('express');
const staffTaskController = require('./staff-task.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.get('/staff-members', authMiddleware, authorize('manager'), staffTaskController.getStaffMembers);
router.get('/staff-tasks', authMiddleware, authorize('manager'), staffTaskController.getStaffTasks);
router.post('/staff-tasks', authMiddleware, authorize('manager'), staffTaskController.createStaffTask);
router.put('/staff-tasks/:taskId', authMiddleware, authorize('manager'), staffTaskController.updateStaffTask);
router.patch('/staff-tasks/:taskId/close', authMiddleware, authorize('manager'), staffTaskController.closeStaffTask);
router.patch('/staff-tasks/:taskId/cancel', authMiddleware, authorize('manager'), staffTaskController.cancelStaffTask);

module.exports = router;
