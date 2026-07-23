import axiosClient from '@/api/axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

const normalizeMaintenance = (item) => ({
  id: item?._id || item?.id,
  room: item?.room || '',
  category: item?.category || '',
  priority: item?.priority || 'medium',
  description: item?.description || '',
  image: item?.image || '',
  images: Array.isArray(item?.images) ? item.images : (item?.image ? [item.image] : []),
  status: item?.status || 'Open',
  assignedTech: item?.assignedTech || '',
  reportedBy: item?.reportedBy || 'Housekeeping',
  note: item?.note || '',
  createdAt: item?.createdAt || null,
  updatedAt: item?.updatedAt || null,
});

const normalizeInspection = (inspection) => ({
  id: inspection?._id || inspection?.id || null,
  roomNumber: inspection?.room_number || '',
  room: inspection?.room || inspection?.room_number || '',
  guest: inspection?.guest || '',
  checklist: inspection?.checklist || {},
  photos: Array.isArray(inspection?.photos) ? inspection.photos : [],
  note: inspection?.note || '',
  remarks: inspection?.remarks || '',
  status: inspection?.status || '',
  taskId: inspection?.task_id || null,
  roomInventoryUsed: Boolean(inspection?.room_inventory_used),
  roomInventory: Array.isArray(inspection?.room_inventory) ? inspection.room_inventory : [],
  roomInventoryReport: inspection?.roomInventoryReport || { items: inspection?.invoice_items || [], total: Number(inspection?.room_inventory_total ?? 0) },
  missingItems: Array.isArray(inspection?.missing_items) ? inspection.missing_items : [],
  damagedItems: Array.isArray(inspection?.damaged_items) ? inspection.damaged_items : [],
  damageMissingItems: Array.isArray(inspection?.damage_missing_items)
    ? inspection.damage_missing_items
    : [
      ...(Array.isArray(inspection?.damaged_items) ? inspection.damaged_items : []),
      ...(Array.isArray(inspection?.missing_items) ? inspection.missing_items : []),
    ],
  maintenanceRequired: Boolean(inspection?.maintenance_required),
  maintenanceRequest: inspection?.maintenance_request ? normalizeMaintenance(inspection.maintenance_request) : null,
  createdAt: inspection?.createdAt || null,
  updatedAt: inspection?.updatedAt || null,
});

export const managerApi = {
  getRooms: (params) => axiosClient.get('/manager/rooms', { params }).then(unwrap),

  getStaffMembers: () => axiosClient.get('/manager/staff-members').then(unwrap),
  getStaffTasks: (params) => axiosClient.get('/manager/staff-tasks', { params }).then(unwrap),
  createStaffTask: (data) => axiosClient.post('/manager/staff-tasks', data).then(unwrap),
  updateStaffTask: (id, data) => axiosClient.put(`/manager/staff-tasks/${id}`, data).then(unwrap),
  closeStaffTask: (id) => axiosClient.patch(`/manager/staff-tasks/${id}/close`).then(unwrap),
  cancelStaffTask: (id) => axiosClient.patch(`/manager/staff-tasks/${id}/cancel`).then(unwrap),

  getRoomInventoryItems: (params) => axiosClient.get('/manager/room-inventory-items', { params }).then(unwrap),
  createRoomInventoryItem: (data) => axiosClient.post('/manager/room-inventory-items', data).then(unwrap),
  updateRoomInventoryItem: (id, data) => axiosClient.put(`/manager/room-inventory-items/${id}`, data).then(unwrap),
  activateRoomInventoryItem: (id) => axiosClient.patch(`/manager/room-inventory-items/${id}/activate`).then(unwrap),
  deactivateRoomInventoryItem: (id) => axiosClient.patch(`/manager/room-inventory-items/${id}/deactivate`).then(unwrap),

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
  getDamageReports: (params = {}) => axiosClient.get('/housekeeping/inspections', { params: { has_damage_report: 'true', ...params } }).then((response) => {
    const payload = unwrap(response);
    const rows = Array.isArray(payload) ? payload : [];
    return rows.map(normalizeInspection);
  }),
  getDamageReportById: (id) => axiosClient.get(`/housekeeping/inspections/${id}`).then((response) => normalizeInspection(unwrap(response))),
  updateDamageReport: (id, data) => axiosClient.patch(`/housekeeping/inspection/${id}`, data).then((response) => normalizeInspection(unwrap(response))),
  createMaintenanceFromInspection: (id, data) => axiosClient.post(`/housekeeping/inspections/${id}/maintenance-request`, data).then((response) => normalizeMaintenance(unwrap(response))),
};
