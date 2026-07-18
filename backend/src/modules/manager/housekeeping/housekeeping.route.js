const express = require('express');
const housekeepingController = require('./housekeeping.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');
const authorize = require('../../../middlewares/authorize.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/rooms', authorize('manager', 'housekeeping', 'receptionist'), housekeepingController.getRooms);
router.get('/dashboard', authorize('manager', 'housekeeping', 'receptionist'), housekeepingController.getDashboard);
router.post('/checkout/confirm', authorize('manager', 'receptionist'), housekeepingController.confirmCheckout);
router.get('/tasks', authorize('manager', 'housekeeping', 'receptionist'), housekeepingController.getTasks);
router.post('/tasks', authorize('manager', 'receptionist'), housekeepingController.createCleaningTask);
router.get('/tasks/:id', authorize('manager', 'housekeeping', 'receptionist'), housekeepingController.getTaskById);
router.patch('/tasks/:id/accept', authorize('manager', 'housekeeping'), housekeepingController.acceptCleaningTask);
router.patch('/tasks/:id/start', authorize('manager', 'housekeeping'), housekeepingController.startCleaningTask);
router.patch('/tasks/:id/complete', authorize('manager', 'housekeeping'), housekeepingController.completeCleaningTask);
router.put('/tasks/:id/status', authorize('manager', 'housekeeping'), housekeepingController.updateTaskStatus);
router.put('/tasks/:id/cancel', authorize('manager', 'housekeeping'), housekeepingController.cancelCleaningTask);

router.get('/service-requests', authorize('manager', 'housekeeping', 'receptionist'), housekeepingController.getServiceRequests);
router.get('/service-requests/:id', authorize('manager', 'housekeeping'), housekeepingController.getServiceRequestById);
router.patch('/service-requests/:id/accept', authorize('manager', 'housekeeping'), housekeepingController.acceptServiceRequest);
router.put('/service-requests/:id/start', authorize('manager', 'housekeeping'), housekeepingController.startServiceRequest);
router.put('/service-requests/:id/complete', authorize('manager', 'housekeeping'), housekeepingController.completeServiceRequest);
router.put('/service-requests/:id/cancel', authorize('manager', 'housekeeping'), housekeepingController.cancelServiceRequest);
router.patch('/service-requests/:id', authorize('manager', 'housekeeping'), housekeepingController.updateServiceRequest);
router.put('/service-requests/:id/unable', authorize('manager', 'housekeeping'), housekeepingController.unableToCompleteServiceRequest);

router.get('/inspections', authorize('manager', 'housekeeping', 'receptionist'), housekeepingController.getInspections);
router.get('/inspections/:id', authorize('manager', 'housekeeping', 'receptionist'), housekeepingController.getInspectionById);
router.get('/inspection/:roomNumber', authorize('manager', 'housekeeping', 'receptionist'), housekeepingController.getInspectionByRoom);
router.post('/inspection', authorize('manager', 'housekeeping', 'receptionist'), housekeepingController.createInspection);
router.patch('/inspection/:id', authorize('manager', 'housekeeping', 'receptionist'), housekeepingController.updateInspection);
router.post('/report-issue', authorize('manager', 'housekeeping', 'receptionist'), housekeepingController.reportRoomIssue);
router.post('/report-room-issue', authorize('manager', 'housekeeping', 'receptionist'), housekeepingController.reportRoomIssue);
router.get('/maintenance-requests', authorize('manager', 'housekeeping', 'receptionist', 'technical'), housekeepingController.getMaintenanceRequests);
router.get('/maintenance-requests/:id', authorize('manager', 'housekeeping', 'receptionist', 'technical'), housekeepingController.getMaintenanceRequestById);
router.patch('/maintenance-requests/:id/assign', authorize('manager'), housekeepingController.assignMaintenanceRequest);
router.patch('/maintenance-requests/:id/status', authorize('manager', 'technical'), housekeepingController.updateMaintenanceRequestStatus);
router.patch('/maintenance-requests/:id/approve', authorize('manager'), housekeepingController.approveMaintenanceRequest);
router.patch('/maintenance-requests/:id/reject', authorize('manager'), housekeepingController.rejectMaintenanceRequest);
router.patch('/maintenance-requests/:id/complete', authorize('manager'), housekeepingController.completeMaintenanceRequest);

module.exports = router;
