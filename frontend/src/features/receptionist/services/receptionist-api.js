import axiosClient from '@/api/axiosClient';

export const bookingApi = {
  getAll: (params) => axiosClient.get('/receptionist/bookings', { params }).then(r => r.data),
  getById: (id) => axiosClient.get(`/receptionist/bookings/${id}`).then(r => r.data),
  checkIn: (id, data) => axiosClient.post(`/receptionist/bookings/${id}/checkin`, data).then(r => r.data),
  createWalkIn: (data) => axiosClient.post('/receptionist/bookings/walkin', data).then(r => r.data),
  getDashboardStats: () => axiosClient.get('/receptionist/dashboard-stats').then(r => r.data),
};

export const roomApi = {
  getAvailable: (params) => axiosClient.get('/receptionist/rooms/available', { params }).then(r => r.data),
};

export const roomTypeApi = {
  getAll: () => axiosClient.get('/receptionist/room-types').then(r => r.data),
};
