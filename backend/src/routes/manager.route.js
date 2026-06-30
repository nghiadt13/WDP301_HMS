const express = require('express');

const {
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
} = require('../controllers/manager.controller');

const router = express.Router();

router.get('/staff-members', listStaffMembers);

router.get('/staff-tasks', listStaffTasks);
router.post('/staff-tasks', createStaffTask);
router.patch('/staff-tasks/:staffTaskId', updateStaffTask);
router.patch('/staff-tasks/:staffTaskId/close', closeStaffTask);
router.patch('/staff-tasks/:staffTaskId/cancel', cancelStaffTask);

router.get('/minibar-items', listMinibarItems);
router.post('/minibar-items', createMinibarItem);
router.patch('/minibar-items/:minibarItemId', updateMinibarItem);
router.delete('/minibar-items/:minibarItemId', deactivateMinibarItem);

router.get('/customer-feedbacks', listCustomerFeedbacks);
router.patch('/customer-feedbacks/:feedbackId/respond', respondCustomerFeedback);
router.patch('/customer-feedbacks/:feedbackId/archive', archiveCustomerFeedback);

module.exports = router;
