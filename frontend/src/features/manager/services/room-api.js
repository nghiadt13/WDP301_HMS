import axiosClient from '@/api/axiosClient';

export const roomApi = {
  getAll: (params) => axiosClient.get('/manager/rooms', { params }).then((res) => res.data),
  getById: (id) => axiosClient.get(`/manager/rooms/${id}`).then((res) => res.data),
  create: (data) => axiosClient.post('/manager/rooms', data).then((res) => res.data),
  update: (id, data) => axiosClient.put(`/manager/rooms/${id}`, data).then((res) => res.data),
  remove: (id) => axiosClient.delete(`/manager/rooms/${id}`).then((res) => res.data),
  hardDelete: (id) => axiosClient.delete(`/manager/rooms/${id}/permanent`).then((res) => res.data),
};

export const roomTypeApi = {
  getAll: () => axiosClient.get('/manager/room-types').then((res) => res.data),
  getById: (id) => axiosClient.get(`/manager/room-types/${id}`).then((res) => res.data),
  create: (data) => axiosClient.post('/manager/room-types', data).then((res) => res.data),
  update: (id, data) => axiosClient.put(`/manager/room-types/${id}`, data).then((res) => res.data),
  remove: (id) => axiosClient.delete(`/manager/room-types/${id}`).then((res) => res.data),
};

export const amenityApi = {
  getAll: () => axiosClient.get('/manager/amenities').then((res) => res.data),
};

export const featureApi = {
  getAll: () => axiosClient.get('/manager/features').then((res) => res.data),
};

export const uploadApi = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return axiosClient.post('/upload/rooms', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data);
  },

  deleteImage: (filename) => {
    return axiosClient.delete(`/upload/rooms/${filename}`).then((res) => res.data);
  },
};
