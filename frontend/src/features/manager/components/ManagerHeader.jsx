import { useEffect, useRef, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, LogOut, Home } from 'lucide-react';

const getPageTitle = (pathname) => {
  if (pathname === '/manager') return 'Bảng điều khiển';
  if (pathname === '/manager/rooms') return 'Quản lý phòng';
  if (pathname === '/manager/rooms/add') return 'Thêm phòng mới';
  if (pathname.includes('/manager/rooms/') && pathname.includes('/edit')) return 'Chỉnh sửa phòng';
  if (pathname === '/manager/housekeeping/daily') return 'Daily Tasks';
  if (pathname === '/manager/housekeeping/tasks') return 'Housekeeping Tasks';
  if (pathname === '/manager/housekeeping/schedule') return 'Maintenance Report';
  if (pathname === '/manager/housekeeping/staff') return 'Housekeeping Staff';
  if (pathname === '/manager/staff-task' || pathname === '/manager/staff-tasks') return 'Nhiệm vụ nhân viên';
  if (pathname === '/manager/room-inventory' || pathname === '/manager/room-inventory-items') return 'Quản lý vật tư phòng';
  if (pathname === '/manager/feedback') return 'Ý kiến khách hàng';
  if (pathname === '/manager/policies') return 'Quản lý chính sách';
  return 'Bảng điều khiển';
};

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('hotelify_user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const ManagerHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const title = getPageTitle(location.pathname);

  const [user, setUser] = useState(readStoredUser);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const syncUser = () => {
      setUser(readStoredUser());
    };

    window.addEventListener('hotelify-auth-change', syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('hotelify-auth-change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    const closeProfileMenu = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
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
    : 'MG';

  const roleName = user?.role?.name || user?.role_name || user?.role || 'Manager';

  const handleLogout = () => {
    localStorage.removeItem('hotelify_token');
    localStorage.removeItem('hotelify_user');
    setUser(null);
    setIsProfileMenuOpen(false);
    window.dispatchEvent(new Event('hotelify-auth-change'));
    navigate('/login');
  };

  return (
    <header className="rm-header">
      <h1>{title}</h1>
      <div className="rm-header-actions">

        <div className="rm-header-right">
          <button className="rm-circle-btn" type="button" aria-label="Messages">
            <MessageSquare size={18} />
          </button>
          <button className="rm-circle-btn" type="button" aria-label="Notifications">
            <Bell size={18} />
          </button>
          
          <div className="rm-profile-container" ref={profileMenuRef}>
            <button
              className="rm-profile"
              type="button"
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.full_name} />
              ) : (
                <span className="rm-profile-avatar">{initials}</span>
              )}
              <span>
                <strong>{user?.full_name || 'Manager'}</strong>
                <small>{roleName}</small>
              </span>
            </button>

            {isProfileMenuOpen ? (
              <div className="rm-profile-dropdown" role="menu">
                <div className="rm-profile-dropdown-header">
                  <strong>{user?.full_name || 'Manager'}</strong>
                  <span>{user?.email || 'manager@hotelify.test'}</span>
                </div>
                <div className="rm-profile-dropdown-divider" />
                <Link
                  to="/"
                  className="rm-profile-dropdown-item"
                  role="menuitem"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <Home size={16} />
                  <span>Trang chủ</span>
                </Link>
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
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ManagerHeader;
