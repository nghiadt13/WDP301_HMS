import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Inbox, Calendar, Megaphone, BedDouble, Sparkles, Package, Wallet, Star, LogIn, ChevronDown } from 'lucide-react';

const sidebarItems = [
  { icon: Home, label: 'Dashboard', to: '/manager' },
  { icon: Inbox, label: 'Inbox' },
  { icon: Calendar, label: 'Calendar' },
  { icon: Megaphone, label: 'Campaigns', hasSub: true },
  { icon: BedDouble, label: 'Rooms', hasSub: true, matchPath: '/manager/rooms' },
  { icon: Sparkles, label: 'Staff Tasks', to: '/manager/staff-tasks' },
  { icon: Package, label: 'Minibar Items', to: '/manager/minibar-items' },
  { icon: Wallet, label: 'Finance', hasSub: true },
  { icon: Star, label: 'Customer Feedback', to: '/manager/feedback', badge: 5 },
  { icon: LogIn, label: 'Register & Login' },
];

const ManagerSidebar = () => {
  const location = useLocation();
  const [roomsOpen, setRoomsOpen] = useState(() => location.pathname.startsWith('/manager/rooms'));

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
        {sidebarItems.map((item) => {
          const { icon: Icon, label, to, hasSub, badge, matchPath } = item;
          const active = isActive(item);
          const isRooms = label === 'Rooms';

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
                    <li><Link to="/manager/rooms" className={`rm-submenu-item${location.pathname === '/manager/rooms' ? ' is-active' : ''}`}>Rooms</Link></li>
                    <li><span className="rm-submenu-item">Create New Room</span></li>
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
      <div className="rm-promo">
        <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=420&q=80" alt="Hotel lobby" />
        <h2>Manage Smarter, Serve Better</h2>
        <p>Automate check-ins, monitor occupancy, and track performance.</p>
        <button type="button">Upgrade to Pro</button>
      </div>
    </aside>
  );
};

export default ManagerSidebar;
