import axiosClient from '@/api/axiosClient';

const unwrap = (response) => response?.data?.data ?? response?.data;
const normalizeTaskPriority = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (['low', 'medium', 'high'].includes(normalized)) {
    return normalized;
  }
  return 'high';
};

const normalizeTask = (task) => ({
  id: task?._id || task?.id,
  roomNumber: task?.room_number || '',
  status: task?.status || '',
  priority: task?.priority || '',
  receptionistNote: task?.receptionistNote || '',
  createdAt: task?.createdAt || null,
});

const normalizeRoom = (room) => ({
  id: room?._id,
  roomNumber: room?.roomName || '',
  roomType: room?.room_type_id?.name || 'Room',
  status: room?.status || 'Available',
  currentGuest: room?.currentGuest || '',
});

export const receptionistApi = {
  async getOperationalBoard() {
    const [roomsResponse, tasksResponse] = await Promise.all([
      axiosClient.get('/housekeeping/rooms', { params: { limit: 300 } }),
      axiosClient.get('/housekeeping/tasks', { params: { staff_type: 'housekeeping' } }),
    ]);

    const roomPayload = unwrap(roomsResponse);
    const rooms = Array.isArray(roomPayload?.data) ? roomPayload.data : Array.isArray(roomPayload) ? roomPayload : [];
    const taskPayload = unwrap(tasksResponse);
    const tasks = Array.isArray(taskPayload) ? taskPayload : [];

    return {
      rooms: rooms.map(normalizeRoom),
      tasks: tasks.map(normalizeTask),
    };
  },

  async confirmCheckout(payload) {
    const response = await axiosClient.post('/housekeeping/checkout/confirm', {
      ...payload,
      priority: normalizeTaskPriority(payload?.priority),
    });
    return unwrap(response);
  },

  async createCleaningTask(payload) {
    const response = await axiosClient.post('/housekeeping/tasks', {
      ...payload,
      priority: normalizeTaskPriority(payload?.priority),
    });
    return unwrap(response);
  },
};

export const bookingApi = {
  getAll: (params) => axiosClient.get('/receptionist/bookings', { params }).then((response) => response.data),
  getById: (id) => axiosClient.get(`/receptionist/bookings/${id}`).then((response) => response.data),
  checkIn: (id, data) => axiosClient.post(`/receptionist/bookings/${id}/checkin`, data).then((response) => response.data),
  createWalkIn: (data) => axiosClient.post('/receptionist/bookings/walkin', data).then((response) => response.data),
  confirmWalkIn: (id, data) => axiosClient.post(`/receptionist/bookings/${id}/walkin-confirm`, data).then((response) => response.data),
  getDashboardStats: () => axiosClient.get('/receptionist/dashboard-stats').then((response) => response.data),
};

export const roomApi = {
  getAvailable: (params) => axiosClient.get('/receptionist/rooms/available', { params }).then((response) => response.data),
};

export const roomTypeApi = {
  getAll: () => axiosClient.get('/receptionist/room-types').then((response) => response.data),
};
