const getClasses = (value, variant = 'status') => {
  const normalized = String(value || '').toLowerCase();
  if (variant === 'priority') {
    if (['high', 'urgent'].includes(normalized)) return 'housekeeping-badge high';
    if (['medium', 'normal'].includes(normalized)) return 'housekeeping-badge medium';
    return 'housekeeping-badge low';
  }

  if (['dirty', 'cancelled', 'canceled', 'closed'].includes(normalized)) return 'housekeeping-badge dirty';
  if (['cleaning', 'in progress', 'inprogress'].includes(normalized)) return 'housekeeping-badge cleaning';
  if (['waitingmaintenance', 'maintenance'].includes(normalized)) return 'housekeeping-badge dirty';
  if (['assigned', 'accepted', 'open'].includes(normalized)) return 'housekeeping-badge inspection';
  if (['resolved', 'completed'].includes(normalized)) return 'housekeeping-badge ready';
  if (['inspection', 'pending'].includes(normalized)) return 'housekeeping-badge inspection';
  return 'housekeeping-badge ready';
};

const labelMap = {
  dirty: 'Bẩn',
  cleaning: 'Đang dọn',
  inspection: 'Kiểm tra',
  ready: 'Sẵn sàng',
  available: 'Trống',
  occupied: 'Đang sử dụng',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
  assigned: 'Đã giao',
  accepted: 'Đã nhận',
  waitingmaintenance: 'Chờ bảo trì',
  maintenance: 'Bảo trì',
  completed: 'Hoàn thành',
  open: 'Mới',
  inprogress: 'Đang xử lý',
  resolved: 'Đã xử lý',
  cancelled: 'Đã hủy',
  canceled: 'Đã hủy',
  'in progress': 'Đang xử lý',
  pending: 'Chờ xử lý',
};

const HousekeepingStatusBadge = ({ value, variant = 'status' }) => {
  const label = labelMap[String(value || '').toLowerCase()] || value || '—';
  return <span className={getClasses(value, variant)}>{label}</span>;
};

export default HousekeepingStatusBadge;
