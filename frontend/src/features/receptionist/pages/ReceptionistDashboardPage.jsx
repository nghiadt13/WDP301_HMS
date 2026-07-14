import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble } from 'lucide-react';
import './ReceptionistDashboardPage.css';
import '../../manager/styles/manager-layout.css';
import { bookings as mockBookings, kpis as mockKpis, quickActions, roomStatus as mockRoomStatus, serviceRequests as mockServiceRequests } from '../data/receptionistDashboardData.js';
import { useDashboardStats } from '../hooks/use-checkin';

const iconPaths = {
  dashboard: 'M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z',
  calendar: 'M5 4h14v16H5V4Zm0 5h14M8 2v4m8-4v4',
  search: 'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.3-2.2L21 21',
  booking: 'M6 3h12v18H6V3Zm3 5h6M9 12h6M9 16h4',
  bed: 'M4 11V6h5a4 4 0 0 1 4 4v1h7v7M4 18v-7h16v7M4 18v2m16-2v2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  wallet: 'M4 7h15v11H4V7Zm0 0V5h13m-1 8h3',
  check: 'M4 4h16v16H4V4Zm4 8 3 3 5-6',
  file: 'M6 3h8l4 4v14H6V3Zm8 0v5h5',
  plus: 'M12 5v14m-7-7h14',
  bell: 'M6 17h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v4.5L6 17Zm4 0a2 2 0 0 0 4 0',
  message: 'M4 5h16v10H8l-4 4V5Z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
};

const Icon = ({ name, size = 20, className = '' }) => (
  <svg className={`receptionist-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d={iconPaths[name]} />
  </svg>
);

const KpiCard = ({ title, value, subtitle, icon, tone }) => (
  <article className="receptionist-card receptionist-kpi-card">
    <span className={`receptionist-kpi-icon ${tone}`}><Icon name={icon} /></span>
    <div>
      <p>{title}</p>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </div>
  </article>
);

const ReceptionistDashboardPage = () => {
  const navigate = useNavigate();
  const { data: liveData, isLoading, error } = useDashboardStats();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
  };

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

  // 1. Dynamic KPIs
  const stats = liveData?.data?.kpis;
  const kpis = [
    ['Khách đến hôm nay', stats ? stats.arrivalsToday : mockKpis[0][1], '+4 khách so với hôm qua', 'booking', 'primary'],
    ['Đã nhận phòng', stats ? stats.checkedInToday : mockKpis[1][1], 'Hoàn thành 67%', 'check', 'success'],
    ['Chờ trả phòng', stats ? stats.departuresToday : mockKpis[2][1], 'Yêu cầu kiểm tra trả phòng', 'arrow', 'warning'],
    ['Yêu cầu đang mở', stats ? stats.activeRequests : mockKpis[3][1], 'Yêu cầu dịch vụ tại phòng', 'message', 'soft'],
  ];

  // 2. Dynamic Room Chart
  const rStats = liveData?.data?.roomStatus;
  const roomStatus = rStats ? [
    ['Sẵn sàng (Trống)', rStats.available, 'available'],
    ['Đang sử dụng', rStats.occupied, 'occupied'],
    ['Đang bảo trì', rStats.maintenance, 'maintenance'],
    ['Chưa dọn dẹp / Khác', rStats.outOfService, 'dirty'],
  ] : mockRoomStatus;

  // 3. Dynamic Service Requests
  const serviceRequests = liveData?.data?.serviceRequests?.length > 0
    ? liveData.data.serviceRequests.map(req => [req.serviceName, `Phòng ${req.roomNumber}`, `Khách: ${req.customerName}`])
    : mockServiceRequests;

  // 4. Dynamic Bookings Table
  const liveBookings = liveData?.data?.recentBookings;

  return (
    <section className="receptionist-content" style={{ padding: 0 }}>
      <div className="receptionist-main-column">
        <section className="receptionist-grid receptionist-kpis">
          {kpis.map((item) => <KpiCard key={item[0]} title={item[0]} value={item[1]} subtitle={item[2]} icon={item[3]} tone={item[4]} />)}
        </section>

        <section className="receptionist-card receptionist-bookings-card">
          <div className="receptionist-card-heading">
            <div>
              <h2>Xem danh sách đặt phòng</h2>
              <p>Quản lý các lượt đặt phòng, khách vãng lai, số tiền đặt cọc và trạng thái nhận phòng của khách hàng.</p>
            </div>
            <button type="button" onClick={() => navigate('/receptionist/walkin')}><Icon name="plus" size={16} />Tạo đặt phòng trực tiếp</button>
          </div>
          <div className="receptionist-table-wrap">
            {isLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                Đang tải dữ liệu thực tế...
              </div>
            ) : liveBookings && liveBookings.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Đặt phòng</th>
                    <th>Khách hàng</th>
                    <th>Loại phòng</th>
                    <th>Thời gian lưu trú</th>
                    <th>Thanh toán</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {liveBookings.map((b) => (
                    <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/receptionist/bookings/${b.id}`)}>
                      <td><strong>{b.bookingCode}</strong></td>
                      <td>{b.customerName}</td>
                      <td><strong>{b.roomTypeName}</strong><small>Phòng {b.roomName}</small></td>
                      <td>{formatDate(b.checkInDate)} - {formatDate(b.checkOutDate)}</td>
                      <td>
                        <span className={`receptionist-status ${b.paymentStatus === 'Paid' ? 'checked-in' : b.paymentStatus === 'DepositPaid' ? 'pending' : 'check-out'}`}>
                          {getPaymentStatusLabel(b.paymentStatus)}
                        </span>
                      </td>
                      <td><span className={getStatusClass(b.bookingStatus)}>{getStatusLabel(b.bookingStatus)}</span></td>
                      <td><button className="receptionist-link-button" type="button" onClick={() => navigate(`/receptionist/bookings/${b.id}`)}>Xem chi tiết</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Đặt phòng</th>
                    <th>Khách hàng</th>
                    <th>Loại phòng</th>
                    <th>Thời gian lưu trú</th>
                    <th>Thanh toán</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {mockBookings.map(([code, guest, room, roomNo, dates, payment, status]) => (
                    <tr key={code}>
                      <td><strong>{code}</strong></td>
                      <td>{guest}</td>
                      <td><strong>{room}</strong><small>Phòng {roomNo}</small></td>
                      <td>{dates}</td>
                      <td>{payment}</td>
                      <td><span className="receptionist-status">{status}</span></td>
                      <td><button className="receptionist-link-button" type="button" onClick={() => navigate('/receptionist/bookings')}>Xem chi tiết</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="receptionist-grid receptionist-actions-grid">
          {quickActions.map(([title, description, icon]) => (
            <article className="receptionist-card receptionist-action-card" key={title} style={{ cursor: 'pointer' }} onClick={() => title.includes('trực tiếp') ? navigate('/receptionist/walkin') : navigate('/receptionist/bookings')}>
              <span><Icon name={icon} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </section>
      </div>

      <aside className="receptionist-side-column">
        <section className="receptionist-card">
          <div className="receptionist-card-heading compact">
            <h2>Sơ đồ phòng</h2>
            <button type="button"><Icon name="dots" size={16} /></button>
          </div>
          <div className="receptionist-room-bars">
            {roomStatus.map(([label, count, type]) => (
              <div key={label}>
                <span><b>{count}</b>{label}</span>
                <i><em className={type} style={{ width: `${Math.min(count, 80)}%` }} /></i>
              </div>
            ))}
          </div>
        </section>

        <section className="receptionist-card">
          <div className="receptionist-card-heading compact">
            <h2>Yêu cầu dịch vụ</h2>
            <button type="button"><Icon name="dots" size={16} /></button>
          </div>
          <div className="receptionist-request-list">
            {serviceRequests.map(([title, room, owner]) => (
              <article key={title}>
                <strong>{title}</strong>
                <span>{room} - {owner}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="receptionist-card receptionist-shift-card">
          <h2>Trọng tâm hôm nay</h2>
          <p>Ưu tiên khách đến nhận phòng, đối soát tiền đặt cọc, xếp phòng trống sạch sẽ và phối hợp kiểm tra phòng trả.</p>
          <button type="button" onClick={() => navigate('/receptionist/bookings')}>Mở danh sách công việc</button>
        </section>
      </aside>
    </section>
  );
};

export default ReceptionistDashboardPage;
