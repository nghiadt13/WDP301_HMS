import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Inbox, Calendar, Megaphone, BedDouble, Sparkles, Package, Wallet, Star, LogIn, ChevronDown, BrushCleaning, FileText, Grid, ClipboardCheck } from 'lucide-react';
import { managerApi } from '../services/manager-api.js';

const FEEDBACK_SEEN_STORAGE_KEY = 'hotelify_manager_seen_feedback_ids';
const FEEDBACK_SEEN_EVENT = 'hotelify-manager-feedback-seen';

const sidebarItems = [
  { icon: Home, label: 'Bảng điều khiển', to: '/manager' },
  { icon: Inbox, label: 'Hộp thư' },
  { icon: Calendar, label: 'Lịch' },
  { icon: Megaphone, label: 'Chiến dịch', hasSub: true },
  { icon: BedDouble, label: 'Loại phòng', hasSub: true, matchPath: '/manager/rooms' },
  { icon: Grid, label: 'Quản lý phòng', hasSub: true, matchPath: '/manager/physical-rooms' },
  { icon: BrushCleaning, label: 'Maintenance', to: '/manager/housekeeping/schedule' },
  { icon: Sparkles, label: 'Nhiệm vụ nhân viên', to: '/manager/staff-task' },
  { icon: Package, label: 'Vật tư phòng', to: '/manager/room-inventory' },
  { icon: FileText, label: 'Chính sách', to: '/manager/policies' },
  { icon: Wallet, label: 'Tài chính', hasSub: true },
  { icon: Star, label: 'Ý kiến khách hàng', to: '/manager/feedback', notificationKey: 'feedback' },
  { icon: LogIn, label: 'Đăng ký & Đăng nhập' },
];

const housekeepingSidebarItems = [
  { icon: ClipboardCheck, label: 'Daily Tasks', to: '/manager/housekeeping/daily' },
  { icon: BrushCleaning, label: 'Cleaning Tasks', to: '/manager/housekeeping/tasks' },
  { icon: Sparkles, label: 'Maintenance Report', to: '/manager/housekeeping/schedule' },
];

const ManagerSidebar = () => {
  const location = useLocation();
  const [roomsOpen, setRoomsOpen] = useState(() => 
    location.pathname.startsWith('/manager/rooms') || location.pathname.startsWith('/manager/room-types')
  );
  const [physicalRoomsOpen, setPhysicalRoomsOpen] = useState(() => 
    location.pathname.startsWith('/manager/physical-rooms') || location.pathname === '/manager/rooms/add' || /\/manager\/rooms\/.*\/edit/.test(location.pathname)
  );

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
  const [feedbackIds, setFeedbackIds] = useState([]);
  const [seenFeedbackIds, setSeenFeedbackIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(FEEDBACK_SEEN_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (isHousekeepingStaff) return;

    managerApi.getCustomerFeedbacks()
      .then((feedbacks) => {
        const ids = (Array.isArray(feedbacks) ? feedbacks : [])
          .map((feedback) => feedback._id || feedback.id)
          .filter(Boolean);
        setFeedbackIds(ids);
      })
      .catch(() => setFeedbackIds([]));
  }, [isHousekeepingStaff]);

  useEffect(() => {
    const syncSeenFeedbackIds = () => {
      try {
        setSeenFeedbackIds(JSON.parse(localStorage.getItem(FEEDBACK_SEEN_STORAGE_KEY) || '[]'));
      } catch {
        setSeenFeedbackIds([]);
      }
    };

    window.addEventListener(FEEDBACK_SEEN_EVENT, syncSeenFeedbackIds);
    window.addEventListener('storage', syncSeenFeedbackIds);

    return () => {
      window.removeEventListener(FEEDBACK_SEEN_EVENT, syncSeenFeedbackIds);
      window.removeEventListener('storage', syncSeenFeedbackIds);
    };
  }, []);

  const unreadFeedbackCount = useMemo(() => {
    const seen = new Set(seenFeedbackIds);
    return feedbackIds.filter((id) => !seen.has(id)).length;
  }, [feedbackIds, seenFeedbackIds]);

  const markFeedbackAsSeen = () => {
    localStorage.setItem(FEEDBACK_SEEN_STORAGE_KEY, JSON.stringify(feedbackIds));
    setSeenFeedbackIds(feedbackIds);
    window.dispatchEvent(new Event(FEEDBACK_SEEN_EVENT));
  };

  const isActive = (item) => {
    if (item.to) return location.pathname === item.to;
    if (item.matchPath) {
      if (item.matchPath === '/manager/rooms') {
        return location.pathname.startsWith('/manager/rooms') && !location.pathname.startsWith('/manager/rooms/add') && !/\/manager\/rooms\/.*\/edit/.test(location.pathname);
      }
      return location.pathname.startsWith(item.matchPath);
    }
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
          const { icon: Icon, label, to, hasSub, matchPath, notificationKey } = item;
          const active = isActive(item);
          const isRooms = label === 'Loại phòng' || label === 'Phòng';
          const isPhysicalRooms = label === 'Quản lý phòng';
          const badge = notificationKey === 'feedback' && unreadFeedbackCount > 0 ? unreadFeedbackCount : null;

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
                    <li><Link to="/manager/rooms" className={`rm-submenu-item${location.pathname === '/manager/rooms' ? ' is-active' : ''}`}>Danh mục loại phòng</Link></li>
                    <li><Link to="/manager/room-types/add" className={`rm-submenu-item${location.pathname === '/manager/room-types/add' ? ' is-active' : ''}`}>Thêm loại phòng mới</Link></li>
                  </ul>
                )}
              </div>
            );
          }

          if (isPhysicalRooms) {
            return (
              <div key={label}>
                <button
                  type="button"
                  onClick={() => setPhysicalRoomsOpen(o => !o)}
                  className={`rm-sidebar-item${active ? ' is-active' : ''}`}
                >
                  {content}
                </button>
                {physicalRoomsOpen && (
                  <ul className="rm-submenu">
                    <li><Link to="/manager/physical-rooms" className={`rm-submenu-item${location.pathname === '/manager/physical-rooms' ? ' is-active' : ''}`}>Danh sách phòng</Link></li>
                    <li><Link to="/manager/rooms/add" className={`rm-submenu-item${location.pathname === '/manager/rooms/add' ? ' is-active' : ''}`}>Thêm phòng mới</Link></li>
                  </ul>
                )}
              </div>
            );
          }

          if (to) {
            return (
              <Link key={label} to={to} className={`rm-sidebar-item${active ? ' is-active' : ''}`} onClick={notificationKey === 'feedback' ? markFeedbackAsSeen : undefined}>
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
