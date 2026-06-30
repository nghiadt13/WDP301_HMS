import axiosClient from '../../../api/axiosClient.js';

export const getStaffMembers = async (role) => {
  const response = await axiosClient.get('/manager/staff-members', {
    params: role ? { role } : {}
  });

  return response.data.staffMembers;
};

export const getStaffTasks = async () => {
  const response = await axiosClient.get('/manager/staff-tasks');

  return response.data.staffTasks;
};

export const createStaffTask = async (payload) => {
  const response = await axiosClient.post('/manager/staff-tasks', payload);

  return response.data.staffTask;
};

export const updateStaffTask = async (staffTaskId, payload) => {
  const response = await axiosClient.patch(`/manager/staff-tasks/${staffTaskId}`, payload);

  return response.data.staffTask;
};

export const closeStaffTask = async (staffTaskId) => {
  const response = await axiosClient.patch(`/manager/staff-tasks/${staffTaskId}/close`);

  return response.data.staffTask;
};

export const cancelStaffTask = async (staffTaskId) => {
  const response = await axiosClient.patch(`/manager/staff-tasks/${staffTaskId}/cancel`);

  return response.data.staffTask;
};

export const getMinibarItems = async () => {
  const response = await axiosClient.get('/manager/minibar-items');

  return response.data.minibarItems;
};

export const createMinibarItem = async (payload) => {
  const response = await axiosClient.post('/manager/minibar-items', payload);

  return response.data.minibarItem;
};

export const updateMinibarItem = async (minibarItemId, payload) => {
  const response = await axiosClient.patch(`/manager/minibar-items/${minibarItemId}`, payload);

  return response.data.minibarItem;
};

export const deactivateMinibarItem = async (minibarItemId) => {
  const response = await axiosClient.delete(`/manager/minibar-items/${minibarItemId}`);

  return response.data.minibarItem;
};

export const getCustomerFeedbacks = async () => {
  const response = await axiosClient.get('/manager/customer-feedbacks');

  return response.data.feedbacks;
};

export const respondCustomerFeedback = async (feedbackId, responseText) => {
  const response = await axiosClient.patch(`/manager/customer-feedbacks/${feedbackId}/respond`, {
    response_text: responseText
  });

  return response.data.feedback;
};

export const archiveCustomerFeedback = async (feedbackId) => {
  const response = await axiosClient.patch(`/manager/customer-feedbacks/${feedbackId}/archive`);

  return response.data.feedback;
};
