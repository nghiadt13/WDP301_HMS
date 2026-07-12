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
    <p className="manager-trend-row">
      <span className={`manager-trend ${trendType}`}><Icon name={trendType === 'up' ? 'up' : 'down'} size={12} />{trendValue}</span>
      <span>{subtitle}</span>
    </p>
  </article>
);


// Mock data
const bookings = [
  ['#BKG-1024', 'Emily Carter', 'Deluxe Suite', '210', '3 Đêm', '10 Th03 - 13 Th03, 2035', 'Đã nhận phòng', 'checked-in'],
  ['#BKG-1025', 'Daniel Wong', 'Superior Room', '315', '2 Đêm', '11 Th03 - 13 Th03, 2035', 'Chờ xử lý', 'pending'],
  ['#BKG-1026', 'Sophia Rivera', 'Executive Suite', '108', '4 Đêm', '09 Th03 - 13 Th03, 2035', 'Đã đặt trước', 'reserved'],
  ['#BKG-1027', 'Liam Johnson', 'Deluxe Suite', '412', '1 Đêm', '12 Th03 - 13 Th03, 2035', 'Đã trả phòng', 'checked-out'],
  ['#BKG-1028', 'Hannah Lee', 'Standard Room', '205', '5 Đêm', '10 Th03 - 15 Th03, 2035', 'Đã nhận phòng', 'checked-in'],
];

const tasks = [
  ['Xác nhận đặt phòng đoàn khách VIP', '12 Tháng 3, 2035'],
  ['Cập nhật lịch bảo trì phòng định kỳ', '13 Tháng 3, 2035'],
  ['Đánh giá báo cáo doanh thu tháng', '14 Tháng 3, 2035'],
  ['Điều phối phân ca làm việc cho nhân viên', '15 Tháng 3, 2035'],
];

const activities = [
  ['Lễ tân', 'user', 'Đã check-in cho Emily Carter tại phòng 210 (Deluxe Suite).', '09:45 SA', 'lime'],
  ['Đội Buồng phòng', 'sparkle', 'Đã đánh dấu phòng 305 là Sạch & Sẵn sàng.', '09:20 SA', 'blue'],
  ['Quản lý duyệt', 'checkSquare', 'Đã phê duyệt các yêu cầu đặc biệt của khách VIP cho ca tối.', '08:50 SA', 'lime'],
  ['Nhân viên đặt phòng', 'calendar', 'Xác nhận đặt phòng doanh nghiệp cho TechVision Ltd., đã giữ 5 phòng.', '08:30 SA', 'blue'],
  ['Hệ thống tự động', 'file', 'Đã tạo và lưu báo cáo doanh thu tháng 3/2035.', '08:00 SA', 'lime'],
  ['Đội Buồng phòng', 'sparkle', 'Đã đánh dấu phòng 216 là Sạch & Sẵn sàng.', '07:20 SA', 'blue'],
];

const ratingItems = [
  ['Độ sạch sẽ', 4.8],
  ['Độ thoải mái', 4.6],
  ['Dịch vụ / Nhân viên', 4.9],
  ['Cơ sở vật chất', 4.5],
  ['Giá trị', 4.6],
  ['Vị trí', 4.7],
];

const ManagerDashboardPage = () => {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('hotelify_user') || 'null');
    } catch {
      return null;
    }
  })();
  const userName = user?.full_name || 'Quản lý';
  const today = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="manager-dashboard">
      <div className="manager-main-column">
        <section className="manager-grid manager-kpis">
          <article className="manager-card manager-greeting">
            <div><h2>Xin chào, {userName}</h2><p>{today}</p></div>
            <div className="manager-earnings"><span>Tổng doanh thu</span><strong>$58.240</strong><p><span>so với tuần trước</span><b><Icon name="up" size={11} />+15.6%</b></p></div>
          </article>
          <StatCard title="Đặt phòng mới" value="128" trendType="up" trendValue="+12.4%" subtitle="so với tuần trước" icon="checkSquare" iconTone="soft" />
          <StatCard title="Khách đã nhận phòng" value="94" trendType="up" trendValue="+8.7%" subtitle="so với tuần trước" icon="login" iconTone="primary" />
          <StatCard title="Khách đã trả phòng" value="76" trendType="down" trendValue="-3.2%" subtitle="so với tuần trước" icon="login" iconTone="pale" />
        </section>

        <section className="manager-grid manager-charts">
          <article className="manager-card manager-chart-card">
            <div className="manager-card-heading"><h2>Doanh thu</h2><button type="button">6 tháng qua <Icon name="chevron" size={14} /></button></div>
            <div className="manager-line-chart">
              <div className="manager-y-axis"><span>$400K</span><span>$300K</span><span>$200K</span><span>$100K</span><span>$0</span></div>
              <div className="manager-chart-canvas">
                <svg viewBox="0 0 350 150" preserveAspectRatio="none">
                  <defs><linearGradient id="managerRevenueGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
                  <g className="manager-grid-lines"><line x1="0" y1="0" x2="350" y2="0" /><line x1="0" y1="37.5" x2="350" y2="37.5" /><line x1="0" y1="75" x2="350" y2="75" /><line x1="0" y1="112.5" x2="350" y2="112.5" /><line x1="0" y1="150" x2="350" y2="150" /></g>
                  <path d="M0,75 C30,75 50,110 80,110 C120,110 140,20 180,20 C220,20 240,100 280,100 C320,100 330,50 350,50 L350,150 L0,150 Z" fill="url(#managerRevenueGradient)" />
                  <path d="M0,75 C30,75 50,110 80,110 C120,110 140,20 180,20 C220,20 240,100 280,100 C320,100 330,50 350,50" fill="none" stroke="#3b82f6" strokeWidth="3" />
                  <circle cx="140" cy="40" r="5" fill="#fff" stroke="#3b82f6" strokeWidth="3" /><line x1="140" y1="40" x2="140" y2="150" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 4" />
                </svg>
                <div className="manager-chart-tooltip"><span>Tổng doanh thu</span><strong>$315,060</strong></div>
                <div className="manager-x-axis"><span>Th1</span><span>Th2</span><span>Th3</span><span>Th4</span><span>Th5</span><span>Th6</span></div>
              </div>
            </div>
          </article>

          <article className="manager-card manager-chart-card">
            <div className="manager-card-heading"><h2>Xu hướng phòng trống</h2><button type="button">7 ngày qua <Icon name="chevron" size={14} /></button></div>
            <div className="manager-legend"><span><i className="blue" /> Đang sử dụng</span><span><i className="gray" /> Trống</span></div>
            <div className="manager-bar-chart">
              {[70, 45, 60, 80, 70, 90, 55].map((value, index) => (
                <div className="manager-bar" key={value + index}>{index === 4 ? <div className="manager-bar-tooltip">15 Tháng 7<br /><strong>72 Phòng</strong></div> : null}<span style={{ height: `${value}%` }} /><small>{12 + index} Th6</small></div>
              ))}
            </div>
          </article>
        </section>

        <section className="manager-grid manager-insights">
          <article className="manager-card">
            <div className="manager-card-heading"><h2>Nguồn đặt phòng</h2><button className="manager-icon-button" type="button" aria-label="Tùy chọn nguồn đặt phòng"><Icon name="dots" /></button></div>
            <div className="manager-source-layout">
              <div className="manager-donut"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="55" /><circle className="donut-blue" cx="70" cy="70" r="55" /><circle className="donut-lime" cx="70" cy="70" r="55" /><circle className="donut-gray" cx="70" cy="70" r="55" /></svg><span><Icon name="bed" size={24} /></span></div>
              <div className="manager-source-list">{[['Trang web trực tiếp', 42, 'blue'], ['Đại lý du lịch trực tuyến (OTA)', 33, 'lime'], ['Khách vãng lai', 15, 'gray'], ['Đối tác doanh nghiệp', 10, 'dark']].map(([label, value, tone]) => <div className="manager-progress" key={label}><p><span>{label}</span><strong>{value}%</strong></p><i><b className={tone} style={{ width: `${value}%` }} /></i></div>)}</div>
            </div>
          </article>

          <article className="manager-card">
            <div className="manager-card-heading"><h2>Đánh giá chung</h2><button className="manager-icon-button" type="button" aria-label="Tùy chọn đánh giá"><Icon name="dots" /></button></div>
            <div className="manager-rating-layout">
              <div className="manager-gauge"><svg viewBox="0 0 180 100"><path d="M 20 90 A 70 70 0 0 1 160 90" /><path className="gauge-value" d="M 20 90 A 70 70 0 0 1 160 90" /><circle cx="90" cy="85" r="8" /><path className="gauge-needle" d="M 90 85 L 145 80" /></svg><span>Tổng số đánh giá</span><strong>4.7 / 5.0</strong><small>1.248 Khách hàng</small></div>
              <div className="manager-rating-list">{ratingItems.map(([label, score]) => <div className="manager-rating-item" key={label}><span>{label}</span><i><b style={{ width: `${(score / 5) * 100}%` }} /></i><strong>{score}<Icon name="star" size={11} /></strong></div>)}</div>
            </div>
          </article>
        </section>

        <section className="manager-card manager-booking-card">
          <div className="manager-booking-heading"><h2>Danh sách đặt phòng</h2><div><label className="manager-table-search"><Icon name="search" size={16} /><input placeholder="Tìm kiếm khách, trạng thái..." type="search" /></label><button type="button">Tất cả trạng thái <Icon name="chevron" size={14} /></button></div></div>
          <div className="manager-table-wrap"><table><thead><tr><th>Mã đặt phòng & Tên khách</th><th>Loại phòng</th><th>Số phòng</th><th>Thời gian</th><th>Ngày đến & Ngày đi</th><th>Trạng thái</th></tr></thead><tbody>{bookings.map(([id, name, type, room, duration, date, status, statusClass]) => <tr key={id}><td><strong>{id}</strong><small>{name}</small></td><td><span className="manager-room-dot" />{type}</td><td>{room}</td><td>{duration}</td><td>{date}</td><td><span className={`manager-status ${statusClass}`}>{status}</span></td></tr>)}</tbody></table></div>
        </section>

        <footer className="manager-footer"><span>Bản quyền © 2026 Hotelify</span><a href="/">Chính sách bảo mật</a><a href="/">Điều khoản và điều kiện</a><a href="/">Liên hệ</a></footer>
      </div>

      <aside className="manager-side-column">
        <article className="manager-card"><div className="manager-card-heading"><h2>Tình trạng phòng trống</h2><button className="manager-icon-button" type="button" aria-label="Tùy chọn tình trạng phòng"><Icon name="dots" /></button></div><div className="manager-total-rooms"><span>Tổng số phòng</span><strong>120</strong></div><div className="manager-room-blocks">{Array.from({ length: 68 }, (_, index) => <span className="occupied" key={`occ-${index}`} />)}{Array.from({ length: 22 }, (_, index) => <span className="reserved" key={`res-${index}`} />)}{Array.from({ length: 25 }, (_, index) => <span className="available" key={`avl-${index}`} />)}{Array.from({ length: 5 }, (_, index) => <span className="not-ready" key={`nr-${index}`} />)}</div><div className="manager-room-legend"><span><i className="occupied" /><strong>68</strong> Đang sử dụng</span><span><i className="available" /><strong>25</strong> Sẵn sàng</span><span><i className="reserved" /><strong>22</strong> Đặt trước</span><span><i className="not-ready" /><strong>5</strong> Chưa dọn</span></div></article>
        <article className="manager-card"><div className="manager-card-heading"><h2>Nhiệm vụ</h2><button className="manager-add-button" type="button" aria-label="Thêm nhiệm vụ"><Icon name="plus" size={16} /></button></div><div className="manager-task-list">{tasks.map(([title, date]) => <label key={title} className="manager-task"><input type="checkbox" /><span><strong>{title}</strong><small>{date}</small></span></label>)}</div></article>
        <article className="manager-card"><div className="manager-card-heading"><h2>Hoạt động gần đây</h2><button className="manager-icon-button" type="button" aria-label="Tùy chọn hoạt động"><Icon name="dots" /></button></div><div className="manager-timeline">{activities.map(([user, icon, text, time, tone]) => <div className="manager-activity" key={`${user}-${time}`}><span className={`manager-activity-icon ${tone}`}><Icon name={icon} size={14} /></span><strong>{user}</strong><p>{text}</p><small>{time}</small></div>)}</div></article>
      </aside>
    </div>
  );
};

export default ManagerDashboardPage;
