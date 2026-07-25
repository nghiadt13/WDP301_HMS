import axiosClient from '../../../api/axiosClient';

export const getHotelPolicies = async () => {
  const response = await axiosClient.get('/policies');
  return response.data.data || response.data.policies || [];
};

export const getCustomerFeedbackRooms = async () => {
  const response = await axiosClient.get('/customer/feedback-rooms');
  return response.data.rooms || [];
};

export const getCustomerFeedbackStatus = async () => {
  const response = await axiosClient.get('/customer/feedback-status');
  return response.data;
};

export const getCustomerFeedbacks = async () => {
  const response = await axiosClient.get('/customer/feedbacks');
  return response.data.feedbacks || [];
};

export const sendCustomerFeedback = async (payload) => {
  const response = await axiosClient.post('/customer/feedbacks', payload);
  return response.data;
};

