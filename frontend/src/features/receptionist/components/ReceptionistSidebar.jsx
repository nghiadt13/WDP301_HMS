import { useNavigate, useLocation } from 'react-router-dom';
import { BedDouble, LayoutDashboard, CalendarDays, UserCheck, LogOut, Home } from 'lucide-react';

const menuItems = [
  { label: 'Bảng điều khiển', icon: LayoutDashboard, path: '/receptionist' },
  { label: 'Danh sách đặt phòng', icon: CalendarDays, path: '/receptionist/bookings' },
  { label: 'Đặt phòng trực tiếp', icon: UserCheck, path: '/receptionist/walkin' },
];

const ReceptionistSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('hotelify_token');
    localStorage.removeItem('hotelify_user');
    window.dispatchEvent(new Event('hotelify-auth-change'));
    navigate('/login');
  };

  return (
    <aside className="rm-sidebar">
      <div className="rm-brand">
        <div className="rm-brand-mark">
          <BedDouble size={16} className="text-white" />
        </div>
        <span>Hotelify</span>
      </div>
      <nav className="rm-nav" aria-label="Receptionist navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`rm-sidebar-item ${isActive ? 'is-active' : ''}`}
              type="button"
              onClick={() => navigate(item.path)}
            >
              <span className="rm-sidebar-label">
                <Icon size={20} className="receptionist-icon" />
                <span>{item.label}</span>
              </span>
            </button>
          );
        })}

        <div style={{ borderTop: '1px solid #f3f4f6', margin: '16px 8px 12px 8px' }} />

        <button
          className="rm-sidebar-item"
          type="button"
          onClick={() => navigate('/')}
        >
          <span className="rm-sidebar-label">
            <Home size={20} className="receptionist-icon" />
            <span>Trang chủ</span>
          </span>
        </button>

        <button
          className="rm-sidebar-item text-danger"
          type="button"
          onClick={handleLogout}
        >
          <span className="rm-sidebar-label">
            <LogOut size={20} className="receptionist-icon text-danger" />
            <span>Đăng xuất</span>
          </span>
        </button>
      </nav>
    </aside>
  );
};

export default ReceptionistSidebar;
