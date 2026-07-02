import axiosClient from '../../../api/axiosClient';

export const getHotelServices = async () => {
  const response = await axiosClient.get('/customer/services');
  return response.data.services || [];
};

export const getCustomerServiceRequests = async () => {
  const response = await axiosClient.get('/customer/service-requests');
  return response.data.requests || [];
};

export const getHotelServiceDetail = async (serviceId) => {
  const response = await axiosClient.get(`/customer/services/${serviceId}`);
  return response.data.service;
};

export const requestHotelService = async (serviceId, payload) => {
  const response = await axiosClient.post(`/customer/services/${serviceId}/requests`, payload);
  return response.data;
};

export const cancelCustomerServiceRequest = async (requestId) => {
  const response = await axiosClient.patch(`/customer/service-requests/${requestId}/cancel`);
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

export const updateCustomerFeedback = async (feedbackId, payload) => {
  const response = await axiosClient.patch('/customer/feedbacks/' + feedbackId, payload);
  return response.data;
};


