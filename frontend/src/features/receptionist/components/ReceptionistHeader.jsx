import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Bell, MessageSquare, LogOut, Home, Search } from 'lucide-react';

const getPageTitle = (pathname) => {
  if (pathname === '/receptionist') return 'Bảng điều khiển Lễ tân';
  if (pathname === '/receptionist/bookings') return 'Danh sách đặt phòng';
  if (pathname.startsWith('/receptionist/bookings/')) return 'Chi tiết đặt phòng';
  if (pathname === '/receptionist/walkin') return 'Tạo đặt phòng trực tiếp';
  return 'Lễ tân';
};

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('hotelify_user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const ReceptionistHeader = () => {
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

  const displayName = user?.full_name === 'Front Desk Receptionist' ? 'Lễ tân' : (user?.full_name || 'Lễ tân');

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
    setUser(null);
    setIsProfileMenuOpen(false);
    window.dispatchEvent(new Event('hotelify-auth-change'));
    navigate('/login');
  };

  return (
    <header className="receptionist-header">
      <div>
        <h1>{title}</h1>
      </div>
      <div className="receptionist-header-actions">
        <label className="receptionist-search">
          <Search size={18} className="receptionist-icon" />
          <input placeholder="Tìm kiếm đặt phòng, khách hàng..." />
        </label>
        <button className="receptionist-circle-button" type="button" aria-label="Messages">
          <MessageSquare size={18} />
        </button>
        <button className="receptionist-circle-button" type="button" aria-label="Notifications">
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
          )}
        </div>
      </div>
    </header>
  );
};

export default ReceptionistHeader;
