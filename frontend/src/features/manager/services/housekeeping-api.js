import axiosClient from '@/api/axiosClient';

const unwrap = (response) => response?.data?.data ?? response?.data;

const normalizeTask = (task) => ({
  id: task?._id || task?.id,
  title: task?.title || 'Cleaning task',
  roomNumber: task?.room_number || '',
  cleaningType: task?.cleaningType || 'Checkout Cleaning',
  priority: task?.priority || 'medium',
  receptionistNote: task?.receptionistNote || '',
  checkoutTime: task?.checkoutTime || task?.createdAt || null,
  status: task?.status || 'Assigned',
  guestRequest: task?.guestRequest || '',
  assignedTo: task?.assigned_to || 'Housekeeping Team',
  assignedBy: task?.assignedBy || 'Receptionist',
  dueTime: task?.deadline || null,
});

const normalizeRoom = (room) => ({
  id: room?._id,
  roomNumber: room?.roomName || '',
  roomType: room?.room_type_id?.name || 'Room',
  status: room?.status || 'Available',
  priority: room?.priority || 'medium',
  floor: room?.floor || '',
  building: room?.building || '',
  notes: room?.description || '',
});

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
});

export const housekeepingApi = {
  async getDashboardSummary() {
    const [dashboardResponse, roomsResponse, tasksResponse, maintenanceResponse] = await Promise.all([
      axiosClient.get('/housekeeping/dashboard'),
      axiosClient.get('/housekeeping/rooms', { params: { limit: 200 } }),
      axiosClient.get('/housekeeping/tasks', { params: { staff_type: 'housekeeping' } }),
      axiosClient.get('/housekeeping/maintenance-requests'),
    ]);

    const dashboard = unwrap(dashboardResponse) || {};
    const roomPayload = unwrap(roomsResponse);
    const rooms = Array.isArray(roomPayload?.data) ? roomPayload.data : Array.isArray(roomPayload) ? roomPayload : [];
    const taskPayload = unwrap(tasksResponse);
    const tasks = Array.isArray(taskPayload) ? taskPayload : [];
    const maintenancePayload = unwrap(maintenanceResponse);
    const maintenance = Array.isArray(maintenancePayload) ? maintenancePayload : [];

    return {
      summary: [
        { title: 'New Cleaning Requests', value: Number(dashboard.newCleaningRequests || 0), tone: 'primary' },
        { title: 'Accepted Tasks', value: Number(dashboard.acceptedTasks || 0), tone: 'warning' },
        { title: 'Rooms Being Cleaned', value: Number(dashboard.roomsBeingCleaned || 0), tone: 'success' },
        { title: 'Waiting Maintenance', value: Number(dashboard.waitingMaintenance || 0), tone: 'neutral' },
        { title: 'Completed Today', value: Number(dashboard.completedToday || 0), tone: 'success' },
      ],
      rooms: rooms.map(normalizeRoom),
      tasks: tasks.map(normalizeTask),
      maintenance: maintenance.map(normalizeMaintenance),
    };
  },

  async getTasks(params = {}) {
    const response = await axiosClient.get('/housekeeping/tasks', {
      params: {
        staff_type: 'housekeeping',
        ...params,
      },
    });
    const payload = unwrap(response);
    const tasks = Array.isArray(payload) ? payload : [];
    return tasks.map(normalizeTask);
  },

  async getMaintenanceRequests() {
    const response = await axiosClient.get('/housekeeping/maintenance-requests');
    const payload = unwrap(response);
    const rows = Array.isArray(payload) ? payload : [];
    return rows.map(normalizeMaintenance);
  },

  async createTask(payload) {
    const response = await axiosClient.post('/housekeeping/tasks', payload);
    return normalizeTask(unwrap(response));
  },

  async confirmCheckout(payload) {
    const response = await axiosClient.post('/housekeeping/checkout/confirm', payload);
    return unwrap(response);
  },

  async acceptTask(id) {
    const response = await axiosClient.patch(`/housekeeping/tasks/${id}/accept`);
    return normalizeTask(unwrap(response));
  },

  async startTask(id) {
    const response = await axiosClient.patch(`/housekeeping/tasks/${id}/start`);
    return normalizeTask(unwrap(response));
  },

  async completeTask(id) {
    const response = await axiosClient.patch(`/housekeeping/tasks/${id}/complete`);
    return normalizeTask(unwrap(response));
  },

  async reportIssue(payload) {
    const response = await axiosClient.post('/housekeeping/report-issue', payload);
    return unwrap(response);
  },
};
