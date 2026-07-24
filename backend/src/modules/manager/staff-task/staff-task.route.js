const express = require('express');
const staffTaskController = require('./staff-task.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.use(authMiddleware, authorize('manager'));

router.get('/staff-members', staffTaskController.getStaffMembers);
router.get('/staff-tasks', staffTaskController.getStaffTasks);
router.post('/staff-tasks', staffTaskController.createStaffTask);
router.put('/staff-tasks/:taskId', staffTaskController.updateStaffTask);
router.patch('/staff-tasks/:taskId/close', staffTaskController.closeStaffTask);
router.patch('/staff-tasks/:taskId/cancel', staffTaskController.cancelStaffTask);

module.exports = router;
