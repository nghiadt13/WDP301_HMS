import axiosClient from '../../../api/axiosClient';

export const getHotelPolicies = async () => {
  const response = await axiosClient.get('/policies');
  return response.data.data || response.data.policies || [];
};

export const getCustomerFeedbackRooms = async () => {
  const response = await axiosClient.get('/customer/feedback-rooms');
  return response.data.rooms || [];
};

export const getCustomerFeedbacks = async () => {
  const response = await axiosClient.get('/customer/feedbacks');
  return response.data.feedbacks || [];
};

export const sendCustomerFeedback = async (payload) => {
  const response = await axiosClient.post('/customer/feedbacks', payload);
  return response.data;
};

export const updateCustomerFeedback = async (feedbackId, payload) => {
  const response = await axiosClient.patch('/customer/feedbacks/' + feedbackId, payload);
  return response.data;
};


