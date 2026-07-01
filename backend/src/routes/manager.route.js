const express = require('express');

const managerController = require('../controllers/manager.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

const router = express.Router();

router.use(authMiddleware, authorize('manager'));

router.get('/staff-members', managerController.getStaffMembers);
router.get('/staff-tasks', managerController.getStaffTasks);
router.post('/staff-tasks', managerController.createStaffTask);
router.put('/staff-tasks/:taskId', managerController.updateStaffTask);
router.patch('/staff-tasks/:taskId/close', managerController.closeStaffTask);
router.patch('/staff-tasks/:taskId/cancel', managerController.cancelStaffTask);

router.get('/minibar-items', managerController.getMinibarItems);
router.post('/minibar-items', managerController.createMinibarItem);
router.put('/minibar-items/:itemId', managerController.updateMinibarItem);
router.patch('/minibar-items/:itemId/deactivate', managerController.deactivateMinibarItem);
router.patch('/minibar-items/:itemId/activate', managerController.activateMinibarItem);

router.get('/customer-feedbacks', managerController.getCustomerFeedbacks);
router.patch('/customer-feedbacks/:feedbackId/respond', managerController.respondCustomerFeedback);
router.patch('/customer-feedbacks/:feedbackId/archive', managerController.archiveCustomerFeedback);

module.exports = router;
