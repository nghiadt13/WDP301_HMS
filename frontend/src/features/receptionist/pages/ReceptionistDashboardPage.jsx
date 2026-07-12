import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, LogOut, Home } from 'lucide-react';
import './ReceptionistDashboardPage.css';
import '../../manager/styles/manager-layout.css';
import { bookings, kpis, menuItems, quickActions, roomStatus, serviceRequests } from '../data/receptionistDashboardData.js';

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

const SidebarItem = ({ label, icon, active, onClick }) => (
  <button className={`rm-sidebar-item ${active ? 'is-active' : ''}`} type="button" onClick={onClick}>
    <span className="rm-sidebar-label">
      <Icon name={icon} />
      <span>{label}</span>
    </span>
  </button>
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

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('hotelify_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const displayName = user?.full_name === 'Front Desk Receptionist' ? 'Lễ tân' : (user?.full_name || 'Lễ tân');

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!isProfileMenuOpen) return undefined;

    const closeProfileMenu = (event) => {
      if (event.key === 'Escape') setIsProfileMenuOpen(false);
    };

    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', closeProfileMenu);
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('keydown', closeProfileMenu);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isProfileMenuOpen]);

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'LT';

  const roleName = user?.role?.name || user?.role_name || user?.role || 'Receptionist';

  const handleLogout = () => {
    localStorage.removeItem('hotelify_token');
    localStorage.removeItem('hotelify_user');
    window.dispatchEvent(new Event('hotelify-auth-change'));
    navigate('/login');
  };

  return (
    <div className="receptionist-dashboard rm-layout">
      <aside className="rm-sidebar">
        <div className="rm-brand">
          <div className="rm-brand-mark"><BedDouble size={16} className="text-white" /></div>
          <span>Hotelify</span>
        </div>
        <nav className="rm-nav" aria-label="Receptionist navigation">
          {menuItems.map(([label, icon], index) => (
            <SidebarItem key={label} label={label} icon={icon} active={index === 0} />
          ))}
          
          <div style={{ borderTop: '1px solid #f3f4f6', margin: '16px 8px 12px 8px' }} />

          <SidebarItem label="Trang chủ" icon="dashboard" active={false} onClick={() => navigate('/')} />
          <SidebarItem label="Đăng xuất" icon="arrow" active={false} onClick={handleLogout} />
        </nav>
        <div className="rm-promo">
          <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=420&q=80" alt="Hotel lobby" />
          <h2>Quản lý thông minh, phục vụ tốt hơn</h2>
          <p>Tự động hóa thủ tục, giám sát hiệu suất và phòng trống.</p>
          <button type="button">Nâng cấp bản Pro</button>
        </div>
      </aside>

      <main className="receptionist-workspace rm-workspace">
        <header className="receptionist-header">
          <div>
            <h1>Bảng điều khiển Lễ tân</h1>
          </div>
          <div className="receptionist-header-actions">
            <label className="receptionist-search">
              <Icon name="search" size={18} />
              <input placeholder="Tìm kiếm đặt phòng, khách hàng, số phòng..." />
            </label>
            <button className="receptionist-circle-button" type="button"><Icon name="message" /></button>
            <button className="receptionist-circle-button" type="button"><Icon name="bell" /></button>
            
            <div className="rm-profile-container" ref={profileMenuRef}>
              <button
                className="rm-profile"
                type="button"
                onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={displayName} style={{ width: '36px', height: '36px', borderRadius: '999px', objectFit: 'cover' }} />
                ) : (
                  <span className="rm-profile-avatar">{initials}</span>
                )}
                <span>
                  <strong>{displayName}</strong>
                  <small>{roleName === 'Receptionist' ? 'Lễ tân' : roleName}</small>
                </span>
              </button>

              {isProfileMenuOpen && (
                <div className="rm-profile-dropdown" role="menu" style={{ right: 0, top: '48px', position: 'absolute', zIndex: 100 }}>
                  <div className="rm-profile-dropdown-header">
                    <strong>{displayName}</strong>
                    <span>{user?.email || 'receptionist@hotelify.com'}</span>
                  </div>
                  <div className="rm-profile-dropdown-divider" />
                  <button
                    type="button"
                    className="rm-profile-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate('/');
                    }}
                  >
                    <Home size={16} />
                    <span>Trang chủ</span>
                  </button>
                  <button
                    type="button"
                    className="rm-profile-dropdown-item text-danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="receptionist-content">
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
                <button type="button"><Icon name="plus" size={16} />Tạo đặt phòng trực tiếp</button>
              </div>
              <div className="receptionist-table-wrap">
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
                    {bookings.map(([code, guest, room, roomNo, dates, payment, status]) => (
                      <tr key={code}>
                        <td><strong>{code}</strong></td>
                        <td>{guest}</td>
                        <td><strong>{room}</strong><small>Phòng {roomNo}</small></td>
                        <td>{dates}</td>
                        <td>{payment}</td>
                        <td><span className="receptionist-status">{status}</span></td>
                        <td><button className="receptionist-link-button" type="button">Chi tiết</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="receptionist-grid receptionist-actions-grid">
              {quickActions.map(([title, description, icon]) => (
                <article className="receptionist-card receptionist-action-card" key={title}>
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
                <button type="button"><Icon name="plus" size={16} /></button>
              </div>
              <div className="receptionist-request-list">
                {serviceRequests.map(([title, room, owner]) => (
                  <article key={title}>
                    <strong>{title}</strong>
                    <span>{room} - Chuyển giao: {owner}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="receptionist-card receptionist-shift-card">
              <h2>Trọng tâm hôm nay</h2>
              <p>Ưu tiên khách đến nhận phòng, đối soát tiền đặt cọc, xếp phòng trống sạch sẽ và phối hợp kiểm tra phòng trả.</p>
              <button type="button">Mở danh sách công việc</button>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default ReceptionistDashboardPage;
