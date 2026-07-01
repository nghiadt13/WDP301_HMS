import { useLocation } from 'react-router-dom';
import { Search, Bell, MessageSquare } from 'lucide-react';

const titleMap = {
  '/manager': 'Dashboard',
  '/manager/rooms': 'Rooms',
};

const ManagerHeader = () => {
  const location = useLocation();
  const title = titleMap[location.pathname] || 'Dashboard';

  return (
    <header className="rm-header">
      <h1>{title}</h1>
      <div className="rm-header-actions">
        <label className="rm-search">
          <Search size={16} />
          <input placeholder="Search placeholder" type="search" />
        </label>
        <button className="rm-circle-btn" type="button" aria-label="Messages">
          <MessageSquare size={18} />
        </button>
        <button className="rm-circle-btn" type="button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="rm-profile">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
            alt="Polina Streward"
          />
          <span>
            <strong>Polina Streward</strong>
            <small>Admin</small>
          </span>
        </div>
      </div>
    </header>
  );
};

export default ManagerHeader;
