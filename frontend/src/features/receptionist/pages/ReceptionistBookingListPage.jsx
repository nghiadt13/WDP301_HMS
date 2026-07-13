import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookings } from '../hooks/use-checkin';
import { CalendarDays, Search, UserPlus, Eye, ArrowRight, ArrowLeft } from 'lucide-react';

const getLocalDateString = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const ReceptionistBookingListPage = () => {
  const navigate = useNavigate();
  const [params, setParams] = useState({
    date: getLocalDateString(),
    status: '',
    search: '',
    page: 1,
    limit: 10
  });

  const { data, isLoading, error } = useBookings(params);

  const handleFilterChange = (key, value) => {
    setParams(prev => ({
      ...prev,
      [key]: value,
      page: 1 // reset page to 1 on filter change
    }));
  };

  const handlePageChange = (newPage) => {
    setParams(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Convert status to appropriate badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'CheckedIn': return 'receptionist-status checked-in';
      case 'CheckedOut': return 'receptionist-status check-out';
      case 'Confirmed': return 'receptionist-status walk-in';
      case 'Pending': return 'receptionist-status pending';
      case 'Canceled': return 'receptionist-status check-out';
      default: return 'receptionist-status pending';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'CheckedIn': return 'Đã nhận phòng';
      case 'CheckedOut': return 'Đã trả phòng';
      case 'Confirmed': return 'Đã xác nhận';
      case 'Pending': return 'Chờ xử lý';
      case 'Canceled': return 'Đã hủy';
      case 'Completed': return 'Hoàn thành';
      default: return status;
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'Paid': return 'Đã thanh toán';
      case 'DepositPaid': return 'Đã đặt cọc';
      case 'Unpaid': return 'Chưa thanh toán';
      default: return status;
    }
  };

  return (
    <div className="receptionist-bookings-list">
      <div className="filter-bar">
        <div className="filter-group">
          <label htmlFor="search-input">Tìm kiếm:</label>
          <div className="receptionist-search" style={{ width: '250px' }}>
            <Search size={18} className="receptionist-icon" />
            <input
              id="search-input"
              placeholder="Mã booking, tên khách..."
              value={params.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="date-select">Ngày nhận phòng:</label>
          <input
            id="date-select"
            type="date"
            value={params.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
          />
          <button 
            type="button" 
            className="pagination-btn"
            style={{ fontSize: '12px', padding: '6px 10px' }}
            onClick={() => handleFilterChange('date', 'all')}
          >
            Tất cả ngày
          </button>
        </div>

        <div className="filter-group">
          <label htmlFor="status-select">Trạng thái:</label>
          <select
            id="status-select"
            value={params.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Pending">Chờ xử lý (Pending)</option>
            <option value="Confirmed">Đã xác nhận (Confirmed)</option>
            <option value="CheckedIn">Đã nhận phòng (CheckedIn)</option>
            <option value="CheckedOut">Đã trả phòng (CheckedOut)</option>
            <option value="Completed">Hoàn thành (Completed)</option>
            <option value="Canceled">Đã hủy (Canceled)</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            className="btn-checkin-primary"
            style={{ padding: '8px 16px', fontSize: '13px', width: 'auto', marginTop: 0 }}
            onClick={() => navigate('/receptionist/walkin')}
          >
            <UserPlus size={16} />
            Tạo đặt phòng walk-in
          </button>
        </div>
      </div>

      <section className="receptionist-card receptionist-bookings-card" style={{ padding: 0 }}>
        <div className="receptionist-table-wrap">
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
              Đang tải danh sách đặt phòng...
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--red)' }}>
              Có lỗi xảy ra: {error.message}
            </div>
          ) : !data || data.data.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
              Không tìm thấy đặt phòng nào khớp điều kiện.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Mã Booking</th>
                  <th>Khách hàng</th>
                  <th>Loại phòng</th>
                  <th>Thời gian ở</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((b) => (
                  <tr 
                    key={b.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/receptionist/bookings/${b.id}`)}
                  >
                    <td><strong>{b.bookingCode}</strong><small>Nguồn: {b.source}</small></td>
                    <td>{b.customerName}</td>
                    <td><strong>{b.roomTypeName}</strong><small>{b.roomQuantity} phòng / {b.guestCount} khách</small></td>
                    <td>{formatDate(b.checkInDate)} - {formatDate(b.checkOutDate)}</td>
                    <td><strong>{formatCurrency(b.totalAmount)}</strong></td>
                    <td>
                      <span className={`receptionist-status ${b.paymentStatus === 'Paid' ? 'checked-in' : b.paymentStatus === 'DepositPaid' ? 'pending' : 'check-out'}`}>
                        {getPaymentStatusLabel(b.paymentStatus)}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusClass(b.bookingStatus)}>
                        {getStatusLabel(b.bookingStatus)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="receptionist-link-button"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/receptionist/bookings/${b.id}`);
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={16} />
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {data && data.pagination && data.pagination.totalPages > 1 && (
        <div className="pagination-container">
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Hiển thị trang {data.pagination.page} / {data.pagination.totalPages} (Tổng {data.pagination.total} đặt phòng)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="pagination-btn"
              disabled={params.page === 1}
              onClick={() => handlePageChange(params.page - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={16} />
              Trang trước
            </button>
            <button
              type="button"
              className="pagination-btn"
              disabled={params.page === data.pagination.totalPages}
              onClick={() => handlePageChange(params.page + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Trang sau
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistBookingListPage;
