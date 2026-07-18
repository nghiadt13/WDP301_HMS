import { useState, useMemo } from 'react';
import { useManagerDashboardStats } from '../hooks/use-dashboard';
import './ManagerDashboardPage.css';

const iconPaths = {
  dashboard: 'M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z',
  message: 'M4 5h16v11H7l-3 3V5Z',
  calendar: 'M5 4h14v16H5V4Zm0 5h14M8 2v4m8-4v4',
  megaphone: 'M4 13h4l9 4V7l-9 4H4v2Zm4 0v5',
  bed: 'M4 11V5h5a4 4 0 0 1 4 4v2h7v7M4 18v-7h16v7M4 18v2m16-2v2',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 12l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z',
  box: 'M4 7l8-4 8 4v10l-8 4-8-4V7Zm8 4 8-4M12 11 4 7m8 4v10',
  wallet: 'M4 7h15v11H4V7Zm0 0V5h13m-1 8h3',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1L12 17.2 6.4 20.1 7.5 14 3 9.6l6.2-.9L12 3Z',
  login: 'M10 17l5-5-5-5m5 5H3m13-8h5v16h-5',
  search: 'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.3-2.2L21 21',
  bell: 'M6 17h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v4.5L6 17Zm4 0a2 2 0 0 0 4 0',
  chat: 'M4 5h16v10H8l-4 4V5Z',
  chevron: 'm7 10 5 5 5-5',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  checkSquare: 'M4 4h16v16H4V4Zm4 8 3 3 5-6',
  plus: 'M12 5v14m-7-7h14',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  file: 'M6 3h8l4 4v14H6V3Zm8 0v5h5',
  up: 'M7 17 17 7m0 0H9m8 0v8',
  down: 'M7 7l10 10m0 0H9m8 0V9',
};

const Icon = ({ name, size = 20, className = '' }) => (
  <svg className={`manager-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d={iconPaths[name]} />
  </svg>
);

const StatCard = ({ title, value, icon, iconTone, trendType, trendValue, subtitle }) => (
  <article className="manager-card manager-stat-card">
    <div className={`manager-stat-icon ${iconTone}`}><Icon name={icon} /></div>
    <div><p className="manager-muted">{title}</p><strong>{value}</strong></div>
    {trendValue && (
      <p className="manager-trend-row">
        <span className={`manager-trend ${trendType}`}><Icon name={trendType === 'up' ? 'up' : 'down'} size={12} />{trendValue}</span>
        <span>{subtitle}</span>
      </p>
    )}
  </article>
);


// Removed mock data

const ManagerDashboardPage = () => {
  const [filter, setFilter] = useState('week');
  const { data: stats, isLoading, isError } = useManagerDashboardStats(filter);
  const [search, setSearch] = useState('');

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('hotelify_user') || 'null');
    } catch {
      return null;
    }
  })();
  const userName = user?.full_name || 'Quản lý';
  const today = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  const getStatusClass = (status) => {
    switch (status) {
      case 'CheckedIn': return 'checked-in';
      case 'CheckedOut': return 'checked-out';
      case 'Pending': return 'pending';
      default: return 'reserved';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'CheckedIn': return 'Đang lưu trú';
      case 'CheckedOut': return 'Đã trả phòng';
      case 'Pending': return 'Chờ xử lý';
      case 'Confirmed': return 'Đã xác nhận';
      default: return status;
    }
  };

  const formatDate = (dateStr) => {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr));
  };

  if (isLoading) return <div style={{ padding: '24px' }}>Đang tải dữ liệu bảng điều khiển...</div>;
  if (isError) return <div style={{ padding: '24px', color: 'red' }}>Lỗi khi tải dữ liệu!</div>;

  const totalRooms = stats?.totalRooms || 120;
  const roomStatusCounts = stats?.roomStatusCounts || [];
  
  const getRoomCount = (statusName) => {
    return roomStatusCounts.find(s => s._id === statusName)?.count || 0;
  };

  const occupiedRooms = getRoomCount('Occupied');
  const availableRooms = getRoomCount('Available');
  const maintenanceRooms = getRoomCount('Maintenance') + getRoomCount('OutOfService');
  const reservedRooms = stats?.reservedRoomsCount || 0;

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  
  // Calculate total revenue correctly in case mock data has 0 for final_total
  const calcTotalRev = (stats?.kpis?.roomRevenue || 0) + (stats?.kpis?.extraRevenue || 0);
  const totalRevenueFmt = formatCurrency(calcTotalRev);
  
  const roomRevenueFmt = formatCurrency(stats?.kpis?.roomRevenue);
  const serviceRevenueFmt = formatCurrency(stats?.kpis?.serviceRevenue);
  const minibarRevenueFmt = formatCurrency(stats?.kpis?.minibarRevenue);
  const otherRevenueFmt = formatCurrency(stats?.kpis?.otherRevenue);

  // Default activities array if empty
  const activities = stats?.activities?.length > 0 ? stats.activities : [
    { user: 'Hệ thống', icon: 'file', text: 'Chưa có hoạt động nào.', time: '', tone: 'gray' }
  ];

  return (
    <div className="manager-dashboard">
      <div className="manager-main-column">
        <section className="manager-grid manager-kpis">
          <article className="manager-card manager-greeting">
            <div><h2>Xin chào, {userName}</h2><p>{today}</p></div>
            <div className="manager-earnings">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Bộ lọc báo cáo:</span>
                <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                  <option value="day">Hôm nay</option>
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng này</option>
                </select>
              </div>
              <span>Tổng doanh thu</span>
              <strong style={{ fontSize: '28px', margin: '4px 0 12px 0', display: 'block' }}>{totalRevenueFmt}</strong>
              <p><span>Cập nhật lúc {new Date().toLocaleTimeString('vi-VN')}</span></p>
            </div>
          </article>
          <StatCard title={`Đặt phòng mới (${filter === 'day' ? 'Hôm nay' : '7 ngày'})`} value={stats?.kpis?.newBookings || 0} icon="checkSquare" iconTone="soft" trendType="up" />
          <StatCard title="Đang lưu trú" value={stats?.kpis?.checkedInGuests || 0} icon="login" iconTone="primary" />
          <StatCard title={`Sắp đến (${filter === 'day' ? 'Hôm nay' : '7 ngày'})`} value={stats?.kpis?.upcomingArrivals || 0} icon="login" iconTone="soft" />
          <StatCard title={`Sắp đi (${filter === 'day' ? 'Hôm nay' : '7 ngày'})`} value={stats?.kpis?.upcomingCheckouts || 0} icon="login" iconTone="pale" />
        </section>

        <section className="manager-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <StatCard title="Tiền phòng" value={roomRevenueFmt} icon="bed" iconTone="primary" />
          <StatCard title="Dịch vụ" value={serviceRevenueFmt} icon="sparkle" iconTone="soft" />
          <StatCard title="Minibar" value={minibarRevenueFmt} icon="box" iconTone="pale" />
          <StatCard title="Thu nhập khác" value={otherRevenueFmt} icon="wallet" iconTone="gray" />
        </section>

        <section className="manager-grid manager-insights" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <article className="manager-card manager-table-wrap">
            <div className="manager-booking-heading">
              <h2>Đặt phòng mới ({filter === 'day' ? 'Hôm nay' : '7 ngày'})</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Phòng</th>
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {stats?.newBookingsList?.map(booking => (
                  <tr key={booking._id}>
                    <td><strong>{booking.customer_id?.full_name || 'Khách vãng lai'}</strong><small>{booking.booking_code}</small></td>
                    <td>{booking.room_type_id?.typeName || '---'}</td>
                    <td>{new Date(booking.created_at).toLocaleDateString('vi-VN')}</td>
                    <td><span className={`manager-status ${getStatusClass(booking.booking_status)}`}>{getStatusText(booking.booking_status)}</span></td>
                  </tr>
                ))}
                {(!stats?.newBookingsList || stats.newBookingsList.length === 0) && (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>Không có dữ liệu.</td></tr>
                )}
              </tbody>
            </table>
          </article>

          <article className="manager-card manager-table-wrap">
            <div className="manager-booking-heading">
              <h2>Đang lưu trú</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Phòng</th>
                  <th>Nhận phòng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {stats?.currentStaysList?.map(booking => (
                  <tr key={booking._id}>
                    <td><strong>{booking.customer_id?.full_name || 'Khách vãng lai'}</strong><small>{booking.booking_code}</small></td>
                    <td>{booking.room_id?.room_number || '---'}</td>
                    <td>{new Date(booking.check_in_date).toLocaleDateString('vi-VN')}</td>
                    <td><span className={`manager-status checked-in`}>Đang lưu trú</span></td>
                  </tr>
                ))}
                {(!stats?.currentStaysList || stats.currentStaysList.length === 0) && (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>Không có dữ liệu.</td></tr>
                )}
              </tbody>
            </table>
          </article>
        </section>

        <section className="manager-grid manager-insights" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <article className="manager-card manager-table-wrap">
            <div className="manager-booking-heading">
              <h2>Khách sắp đến ({filter === 'day' ? 'Hôm nay' : '7 ngày'})</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Phòng</th>
                  <th>Nhận phòng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {stats?.upcomingArrivalsList?.map(booking => (
                  <tr key={booking._id}>
                    <td><strong>{booking.customer_id?.full_name || 'Khách vãng lai'}</strong><small>{booking.booking_code}</small></td>
                    <td>{booking.room_type_id?.typeName || '---'}</td>
                    <td>{new Date(booking.check_in_date).toLocaleDateString('vi-VN')}</td>
                    <td><span className={`manager-status ${getStatusClass(booking.booking_status)}`}>{getStatusText(booking.booking_status)}</span></td>
                  </tr>
                ))}
                {(!stats?.upcomingArrivalsList || stats.upcomingArrivalsList.length === 0) && (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>Không có dữ liệu.</td></tr>
                )}
              </tbody>
            </table>
          </article>

          <article className="manager-card manager-table-wrap">
            <div className="manager-booking-heading">
              <h2>Khách sắp đi ({filter === 'day' ? 'Hôm nay' : '7 ngày'})</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Phòng</th>
                  <th>Trả phòng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {stats?.upcomingCheckoutsList?.map(booking => (
                  <tr key={booking._id}>
                    <td><strong>{booking.customer_id?.full_name || 'Khách vãng lai'}</strong><small>{booking.booking_code}</small></td>
                    <td>{booking.room_id?.room_number || '---'}</td>
                    <td>{new Date(booking.check_out_date).toLocaleDateString('vi-VN')}</td>
                    <td><span className={`manager-status checked-in`}>{getStatusText(booking.booking_status)}</span></td>
                  </tr>
                ))}
                {(!stats?.upcomingCheckoutsList || stats.upcomingCheckoutsList.length === 0) && (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>Không có dữ liệu.</td></tr>
                )}
              </tbody>
            </table>
          </article>
        </section>

        <section className="manager-grid manager-charts">
          <article className="manager-card manager-chart-card">
            <div className="manager-card-heading"><h2>Doanh thu 6 tháng qua</h2></div>
            <div className="manager-line-chart" style={{ padding: '20px 0', display: 'flex', alignItems: 'flex-end', height: '200px', gap: '20px', overflowX: 'auto' }}>
              {stats?.revenueByMonth?.length > 0 ? (
                stats.revenueByMonth.map((month, idx) => {
                  const maxTotal = Math.max(...stats.revenueByMonth.map(m => m.total), 1);
                  const height = `${(month.total / maxTotal) * 100}%`;
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#3b82f6' }}>${month.total}</div>
                      <div style={{ width: '40%', minWidth: '20px', background: 'linear-gradient(to top, #3b82f6, #93c5fd)', height: height, borderRadius: '4px 4px 0 0' }}></div>
                      <div style={{ fontSize: '12px', marginTop: '8px', color: '#64748b' }}>{month.label}</div>
                    </div>
                  );
                })
              ) : (
                <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu doanh thu</div>
              )}
            </div>
          </article>

          <article className="manager-card manager-chart-card">
            <div className="manager-card-heading"><h2>Nguồn đặt phòng</h2></div>
            <div style={{ padding: '20px', display: 'grid', gap: '16px' }}>
              {stats?.sourceCounts?.length > 0 ? (
                stats.sourceCounts.map(source => {
                  const percent = stats.kpis?.newBookings > 0 ? (source.count / stats.kpis.newBookings) * 100 : 50;
                  return (
                  <div key={source._id} className="manager-progress">
                    <p><span>{source._id || 'Khác'}</span><strong>{source.count}</strong></p>
                    <i><b className="blue" style={{ width: `${percent}%` }} /></i>
                  </div>
                )})
              ) : (
                <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu nguồn</div>
              )}
            </div>
          </article>
        </section>

        <section className="manager-grid manager-insights">
          <article className="manager-card">
            <div className="manager-card-heading"><h2>Cơ cấu doanh thu</h2><button className="manager-icon-button" type="button"><Icon name="dots" /></button></div>
            <div style={{ padding: '20px 0' }}>
               <div className="manager-progress">
                  <p><span>Tiền phòng</span><strong>${stats?.kpis?.roomRevenue || 0}</strong></p>
                  <i><b className="blue" style={{ width: `${(stats?.kpis?.roomRevenue / stats?.kpis?.totalRevenue) * 100 || 0}%` }} /></i>
               </div>
               <div className="manager-progress" style={{ marginTop: '16px' }}>
                  <p><span>Phụ phí / Minibar</span><strong>${stats?.kpis?.extraRevenue || 0}</strong></p>
                  <i><b className="lime" style={{ width: `${(stats?.kpis?.extraRevenue / stats?.kpis?.totalRevenue) * 100 || 0}%` }} /></i>
               </div>
            </div>
          </article>

          <article className="manager-card">
            <div className="manager-card-heading"><h2>Đánh giá chung</h2><button className="manager-icon-button" type="button"><Icon name="dots" /></button></div>
            <div className="manager-rating-layout">
              <div className="manager-gauge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                  <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--blue)" strokeWidth="12" strokeDasharray={`${(stats?.avgRating || 0) / 5 * 251} 251`} />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <strong style={{ fontSize: '24px', color: 'var(--blue)' }}>{stats?.avgRating || '0.0'}</strong>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>/ 5.0</span>
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Tổng cộng</span>
                  <strong style={{ fontSize: '16px', color: 'var(--ink)' }}>{stats?.totalReviews || 0} đánh giá</strong>
                </div>
              </div>
              <div className="manager-rating-list">
                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
                  Đây là điểm trung bình tổng hợp từ toàn bộ các phản hồi và đánh giá của khách hàng trong hệ thống (thực tế lấy từ dữ liệu CustomerFeedback).
                </div>
              </div>
            </div>
          </article>
        </section>

        <footer className="manager-footer"><span>Bản quyền © 2026 Hotelify</span><a href="/">Chính sách bảo mật</a><a href="/">Điều khoản và điều kiện</a><a href="/">Liên hệ</a></footer>
      </div>

      <aside className="manager-side-column">
        <article className="manager-card">
          <div className="manager-card-heading"><h2>Tình trạng phòng</h2></div>
          <div className="manager-total-rooms"><span>Tổng số phòng</span><strong>{totalRooms}</strong></div>
          <div className="manager-room-blocks">
            {Array.from({ length: occupiedRooms }, (_, index) => <span className="occupied" key={`occ-${index}`} />)}
            {Array.from({ length: reservedRooms }, (_, index) => <span className="reserved" key={`res-${index}`} />)}
            {Array.from({ length: availableRooms }, (_, index) => <span className="available" key={`avl-${index}`} />)}
            {Array.from({ length: maintenanceRooms }, (_, index) => <span className="not-ready" key={`nr-${index}`} />)}
          </div>
          <div className="manager-room-legend">
            <span><i className="occupied" /><strong>{occupiedRooms}</strong> Đang sử dụng</span>
            <span><i className="available" /><strong>{availableRooms}</strong> Sẵn sàng</span>
            <span><i className="reserved" /><strong>{reservedRooms}</strong> Đặt trước</span>
            <span><i className="not-ready" /><strong>{maintenanceRooms}</strong> Bảo trì</span>
          </div>
        </article>
        
        <article className="manager-card">
          <div className="manager-card-heading"><h2>Nhiệm vụ chưa đóng</h2><button className="manager-add-button" type="button"><Icon name="plus" size={16} /></button></div>
          <div className="manager-task-list">
            {stats?.recentTasks?.map(task => (
              <label key={task._id} className="manager-task">
                <input type="checkbox" />
                <span><strong>{task.title}</strong><small>{task.staff_type} - {formatDate(task.deadline)}</small></span>
              </label>
            ))}
            {(!stats?.recentTasks || stats.recentTasks.length === 0) && (
              <div style={{ color: '#64748b', fontSize: '13px' }}>Không có nhiệm vụ mở.</div>
            )}
          </div>
        </article>
        
        <article className="manager-card">
          <div className="manager-card-heading"><h2>Hoạt động gần đây</h2></div>
          <div className="manager-timeline">
            {activities.map((activity, idx) => (
              <div className="manager-activity" key={`${activity.user}-${idx}`}>
                <span className={`manager-activity-icon ${activity.tone}`}><Icon name={activity.icon} size={14} /></span>
                <strong>{activity.user}</strong>
                <p>{activity.text}</p>
                <small>{activity.time}</small>
              </div>
            ))}
          </div>
        </article>
      </aside>
    </div>
  );
};

export default ManagerDashboardPage;
