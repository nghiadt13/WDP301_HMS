import { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

const titleMap = {
  '/admin': 'Admin Dashboard',
  '/admin/accounts': 'Internal Accounts',
  '/admin/roles': 'Roles & Permissions',
};

const AdminHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const storedUser = localStorage.getItem('hotelify_user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  let title = 'Admin Portal';
  Object.keys(titleMap).forEach(key => {
    if (location.pathname === key || location.pathname.startsWith(`${key}/`)) {
      title = titleMap[key];
    }
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('hotelify_token');
    localStorage.removeItem('hotelify_user');
    window.location.href = '/login';
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="rm-header">
      <h1>{title}</h1>
      <div className="rm-header-actions">

        <button className="rm-circle-btn" type="button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        
        <div className="rm-profile-container" ref={dropdownRef}>
          <button className="rm-profile" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="rm-profile-avatar">
              {getInitials(user?.full_name || 'System Admin')}
            </div>
            <span>
              <strong>{user?.full_name || 'System Admin'}</strong>
              <small>{user?.role?.name || 'Administrator'}</small>
            </span>
          </button>
          
          {showDropdown && (
            <div className="rm-profile-dropdown">
              <div className="rm-profile-dropdown-header">
                <strong>{user?.full_name || 'System Admin'}</strong>
                <span>{user?.email || 'admin@hotelify.com'}</span>
              </div>
              <div className="rm-profile-dropdown-divider"></div>
              
              <Link to="/admin/profile" className="rm-profile-dropdown-item" onClick={() => setShowDropdown(false)}>
                <User size={16} /> My Profile
              </Link>
              
              <div className="rm-profile-dropdown-divider"></div>
              
              <button onClick={handleLogout} className="rm-profile-dropdown-item text-danger">
                <LogOut size={16} /> Log Out
              </button>
            </div>
          )}
        </div>
        
      </div>
    </header>
  );
};

export default AdminHeader;
