import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Inbox, Calendar, Megaphone, BedDouble, Sparkles, Package, Wallet, Star, LogIn, ChevronDown, BrushCleaning, FileText } from 'lucide-react';

const sidebarItems = [
  { icon: Home, label: 'Bảng điều khiển', to: '/manager' },
  { icon: Inbox, label: 'Hộp thư' },
  { icon: Calendar, label: 'Lịch' },
  { icon: Megaphone, label: 'Chiến dịch', hasSub: true },
  { icon: BedDouble, label: 'Phòng', hasSub: true, matchPath: '/manager/rooms' },
  { icon: BrushCleaning, label: 'Housekeeping', to: '/manager/housekeeping' },
  { icon: Sparkles, label: 'Nhiệm vụ nhân viên', to: '/manager/staff-task' },
  { icon: Package, label: 'Đồ dùng Minibar', to: '/manager/minibar' },
  { icon: FileText, label: 'Chính sách', to: '/manager/policies' },
  { icon: Wallet, label: 'Tài chính', hasSub: true },
  { icon: Star, label: 'Ý kiến khách hàng', to: '/manager/feedback', badge: 5 },
  { icon: LogIn, label: 'Đăng ký & Đăng nhập' },
];

const housekeepingSidebarItems = [
  { icon: BrushCleaning, label: 'Cleaning Tasks', to: '/manager/housekeeping/tasks' },
  { icon: Sparkles, label: 'Maintenance Report', to: '/manager/housekeeping/schedule' },
  { icon: Package, label: 'Minibar', to: '/manager/minibar' },
];

const ManagerSidebar = () => {
  const location = useLocation();
  const [roomsOpen, setRoomsOpen] = useState(() => location.pathname.startsWith('/manager/rooms'));

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('hotelify_user') || 'null');
    } catch {
      return null;
    }
  })();
  const roleName = String(storedUser?.role?.name || '').toLowerCase();
  const isHousekeepingStaff = roleName.includes('housekeeping');
  const visibleSidebarItems = isHousekeepingStaff ? housekeepingSidebarItems : sidebarItems;

  const isActive = (item) => {
    if (item.to) return location.pathname === item.to;
    if (item.matchPath) return location.pathname.startsWith(item.matchPath);
    return false;
  };

  return (
    <aside className="rm-sidebar">
      <div className="rm-brand">
        <div className="rm-brand-mark"><BedDouble size={16} className="text-white" /></div>
        <span>Hotelify</span>
      </div>
      <nav className="rm-nav">
        {visibleSidebarItems.map((item) => {
          const { icon: Icon, label, to, hasSub, badge, matchPath } = item;
          const active = isActive(item);
          const isRooms = label === 'Phòng';

          const content = (
            <>
              <span className="rm-sidebar-label"><Icon size={16} /><span>{label}</span></span>
              <span className="rm-sidebar-meta">
                {badge != null && <span className="rm-badge">{badge}</span>}
                {hasSub && <ChevronDown size={14} />}
              </span>
            </>
          );

          if (isRooms) {
            return (
              <div key={label}>
                <button
                  type="button"
                  onClick={() => setRoomsOpen(o => !o)}
                  className={`rm-sidebar-item${active ? ' is-active' : ''}`}
                >
                  {content}
                </button>
                {roomsOpen && (
                  <ul className="rm-submenu">
                    <li><Link to="/manager/rooms" className={`rm-submenu-item${location.pathname === '/manager/rooms' ? ' is-active' : ''}`}>Phòng</Link></li>
                    <li><Link to="/manager/rooms/add" className={`rm-submenu-item${location.pathname === '/manager/rooms/add' ? ' is-active' : ''}`}>Thêm phòng mới</Link></li>
                  </ul>
                )}
              </div>
            );
          }

          if (to) {
            return (
              <Link key={label} to={to} className={`rm-sidebar-item${active ? ' is-active' : ''}`}>
                {content}
              </Link>
            );
          }

          return (
            <button key={label} type="button" className={`rm-sidebar-item${active ? ' is-active' : ''}`}>
              {content}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default ManagerSidebar;
