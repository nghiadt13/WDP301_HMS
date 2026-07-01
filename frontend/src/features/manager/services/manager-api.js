import axiosClient from '@/api/axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const managerApi = {
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
  archiveCustomerFeedback: (id) => axiosClient.patch(`/manager/customer-feedbacks/${id}/archive`).then(unwrap),
};
