import { useLocation } from 'react-router-dom';
import { Search, Bell, MessageSquare } from 'lucide-react';

const titleMap = {
  '/admin': 'Admin Dashboard',
  '/admin/accounts': 'Internal Accounts',
  '/admin/roles': 'Roles & Permissions',
};

const AdminHeader = () => {
  const location = useLocation();
  let title = 'Admin Portal';
  
  Object.keys(titleMap).forEach(key => {
    if (location.pathname === key || location.pathname.startsWith(`${key}/`)) {
      title = titleMap[key];
    }
  });

  return (
    <header className="rm-header">
      <h1>{title}</h1>
      <div className="rm-header-actions">
        <label className="rm-search">
          <Search size={16} />
          <input placeholder="Search accounts..." type="search" />
        </label>
        <button className="rm-circle-btn" type="button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="rm-profile">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80"
            alt="Admin User"
          />
          <span>
            <strong>System Admin</strong>
            <small>Administrator</small>
          </span>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
