import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Building2, CalendarDays, Search } from 'lucide-react';

import { getCustomerFeedbackStatus } from '../features/customer/api/customerApi';

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('hotelify_user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const AppHeader = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(readStoredUser);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const syncUser = () => {
      setUser(readStoredUser());
      setIsProfileMenuOpen(false);
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
    : 'GU';

  const roleName = String(user?.role?.name || user?.role_name || user?.role || '').toLowerCase();
  const isCustomer = roleName.includes('customer') || roleName.includes('khách');
  const isManager = roleName.includes('manager');
  const isReceptionist = roleName.includes('receptionist');
  const hasDashboard = isManager || isReceptionist;
  const dashboardUrl = isManager ? '/manager' : isReceptionist ? '/receptionist' : '';

  useEffect(() => {
    if (!isCustomer || !localStorage.getItem('hotelify_token')) {
      setPendingFeedbackCount(0);
      return;
    }

    let isMounted = true;
    getCustomerFeedbackStatus()
      .then((status) => {
        if (isMounted) {
          setPendingFeedbackCount(Number(status.pendingCount || 0));
        }
      })
      .catch(() => {
        if (isMounted) {
          setPendingFeedbackCount(0);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isCustomer, user?._id]);

  const handleLogout = () => {
    localStorage.removeItem('hotelify_token');
    localStorage.removeItem('hotelify_user');
    setUser(null);
    setIsProfileMenuOpen(false);
    window.dispatchEvent(new Event('hotelify-auth-change'));
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-header">
      <Link className="header-brand" to="/" aria-label="Trang chủ Hotelify">
        <Building2 size={28} strokeWidth={2.2} />
        <span>Hotelify</span>
      </Link>

      <nav className="header-nav" aria-label="Điều hướng chính">
        <Link to="/">Trang chủ</Link>
        <Link to="/listRoom">Danh sách phòng</Link>
        <Link to="/booking">Đặt phòng</Link>
        {isCustomer ? (
          <>
            <Link to="/customer/policies">Chính sách</Link>
            <Link className={pendingFeedbackCount > 0 ? 'header-feedback-link has-review-alert' : 'header-feedback-link'} to="/customer/feedback">
              Góp ý
              {pendingFeedbackCount > 0 ? <span>{pendingFeedbackCount}</span> : null}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="header-actions">
        <label className="header-search">
          <Search size={18} />
          <input type="search" placeholder="Tìm kiếm" />
        </label>

        <Link className="header-icon-button has-dot" to="/booking" aria-label="Đặt phòng">
          <CalendarDays size={20} />
        </Link>

        <button className="header-icon-button" type="button" aria-label="Thông báo">
          <Bell size={20} />
        </button>

        {user ? (
          <div className="header-profile-menu" ref={profileMenuRef}>
            <button
              className="header-profile"
              type="button"
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
            >
              <span className="header-avatar-wrap">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.full_name} />
                ) : (
                  <span className="header-avatar" aria-hidden="true">
                    {initials}
                  </span>
                )}
              </span>
              <span className="header-profile-copy">
                <strong>{user.full_name}</strong>
                <span>{user.role?.name || 'Khách hàng'}</span>
              </span>
            </button>

            {isProfileMenuOpen ? (
              <div className="header-profile-dropdown" role="menu">
                <div className="header-profile-summary">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.full_name} />
                  ) : (
                    <span className="header-avatar" aria-hidden="true">
                      {initials}
                    </span>
                  )}
                  <div>
                    <strong>{user.full_name}</strong>
                    <span>{user.email || user.role?.name || 'Khách hàng'}</span>
                  </div>
                </div>
                {hasDashboard ? (
                  <Link
                    className="header-profile-menu-item"
                    to={dashboardUrl}
                    role="menuitem"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    Quản lý
                  </Link>
                ) : (
                  <>
                    <Link
                      className="header-profile-menu-item"
                      to="/profile"
                      role="menuitem"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Hồ sơ của tôi
                    </Link>
                    <Link
                      className="header-profile-menu-item"
                      to="/change-password"
                      role="menuitem"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Đổi mật khẩu
                    </Link>
                  </>
                )}
                <button
                  className="header-profile-menu-item"
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <Link className="header-login-link" to="/login">
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
