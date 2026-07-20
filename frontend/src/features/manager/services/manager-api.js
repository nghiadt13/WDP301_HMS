import axiosClient from '@/api/axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

const normalizeMaintenance = (item) => ({
  id: item?._id || item?.id,
  room: item?.room || '',
  category: item?.category || '',
  priority: item?.priority || 'medium',
  description: item?.description || '',
  image: item?.image || '',
  status: item?.status || 'Open',
  assignedTech: item?.assignedTech || '',
  reportedBy: item?.reportedBy || 'Housekeeping',
  note: item?.note || '',
  createdAt: item?.createdAt || null,
  updatedAt: item?.updatedAt || null,
});

export const managerApi = {
  getRooms: (params) => axiosClient.get('/manager/rooms', { params }).then(unwrap),

  getStaffMembers: () => axiosClient.get('/manager/staff-members').then(unwrap),
  getStaffTasks: (params) => axiosClient.get('/manager/staff-tasks', { params }).then(unwrap),
  createStaffTask: (data) => axiosClient.post('/manager/staff-tasks', data).then(unwrap),
  updateStaffTask: (id, data) => axiosClient.put(`/manager/staff-tasks/${id}`, data).then(unwrap),
  closeStaffTask: (id) => axiosClient.patch(`/manager/staff-tasks/${id}/close`).then(unwrap),
  cancelStaffTask: (id) => axiosClient.patch(`/manager/staff-tasks/${id}/cancel`).then(unwrap),

  getMinibarItems: (params) => axiosClient.get('/manager/minibar-items', { params }).then(unwrap),
  createMinibarItem: (data) => axiosClient.post('/manager/minibar-items', data).then(unwrap),
  updateMinibarItem: (id, data) => axiosClient.put(`/manager/minibar-items/${id}`, data).then(unwrap),
  activateMinibarItem: (id) => axiosClient.patch(`/manager/minibar-items/${id}/activate`).then(unwrap),
  deactivateMinibarItem: (id) => axiosClient.patch(`/manager/minibar-items/${id}/deactivate`).then(unwrap),

  getCustomerFeedbacks: (params) => axiosClient.get('/manager/customer-feedbacks', { params }).then(unwrap),
  respondCustomerFeedback: (id, responseText) => axiosClient.patch(`/manager/customer-feedbacks/${id}/respond`, { responseText }).then(unwrap),

  getPolicies: () => axiosClient.get('/manager/policies').then(unwrap),
  createPolicy: (data) => axiosClient.post('/manager/policies', data).then(unwrap),
  updatePolicy: (id, data) => axiosClient.put(`/manager/policies/${id}`, data).then(unwrap),
  deletePolicy: (id) => axiosClient.delete(`/manager/policies/${id}`).then(unwrap),

  getMaintenanceRequests: (params = {}) => axiosClient.get('/housekeeping/maintenance-requests', { params }).then((response) => {
    const payload = unwrap(response);
    const rows = Array.isArray(payload) ? payload : [];
    return rows.map(normalizeMaintenance);
  }),

  getMaintenanceRequestById: (id) => axiosClient.get(`/housekeeping/maintenance-requests/${id}`).then((response) => normalizeMaintenance(unwrap(response))),
  assignMaintenanceRequest: (id, data) => axiosClient.patch(`/housekeeping/maintenance-requests/${id}/assign`, data).then((response) => normalizeMaintenance(unwrap(response))),
  updateMaintenanceRequestStatus: (id, data) => axiosClient.patch(`/housekeeping/maintenance-requests/${id}/status`, data).then((response) => normalizeMaintenance(unwrap(response))),
  reportMaintenanceIssue: (data) => axiosClient.post('/housekeeping/report-issue', data).then(unwrap),
};
