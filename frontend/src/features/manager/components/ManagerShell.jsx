import { NavLink } from 'react-router-dom';

import '../pages/ManagerDashboardPage.css';

const iconPaths = {
  dashboard: 'M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z',
  message: 'M4 5h16v11H7l-3 3V5Z',
  calendar: 'M5 4h14v16H5V4Zm0 5h14M8 2v4m8-4v4',
  megaphone: 'M4 13h4l9 4V7l-9 4H4v2Zm4 0v5',
  bed: 'M4 11V5h5a4 4 0 0 1 4 4v2h7v7M4 18v-7h16v7M4 18v2m16-2v2',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 12l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z',
  box: 'M4 7l8-4 8 4v10l-8 4-8-4V7Zm8 4 8-4M12 11 4 7m8 4v10',
  wallet: 'M4 7h15v11H4V7Zm0 0V5h13m-1 8h3',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1L12 17.2 6.4 20.1 7.5 14 3 9.6l6.2-.9L12 3Z',
  login: 'M10 17l5-5-5-5m5 5H3m13-8h5v16h-5',
  search: 'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.3-2.2L21 21',
  bell: 'M6 17h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v4.5L6 17Zm4 0a2 2 0 0 0 4 0',
  chat: 'M4 5h16v10H8l-4 4V5Z',
  up: 'M7 17 17 7m0 0H9m8 0v8',
  file: 'M6 3h8l4 4v14H6V3Zm8 0v5h5'
};

export const Icon = ({ name, size = 20, className = '' }) => (
  <svg className={`manager-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d={iconPaths[name]} />
  </svg>
);

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', to: '/manager', end: true },
  { icon: 'bed', label: 'Room Types', to: '/manager/room-types' },
  { icon: 'sparkle', label: 'Staff Tasks', to: '/manager/staff-tasks' },
  { icon: 'box', label: 'Minibar Items', to: '/manager/minibar-items' },
  { icon: 'star', label: 'Customer Feedback', to: '/manager/feedback' }
];

const quietItems = [
  { icon: 'message', label: 'Inbox' },
  { icon: 'calendar', label: 'Calendar' },
  { icon: 'megaphone', label: 'Campaigns' },
  { icon: 'wallet', label: 'Finance' },
  { icon: 'login', label: 'Register & Login' }
];

const ManagerShell = ({ title = 'Dashboard', children }) => (
  <div className="manager-dashboard">
    <aside className="manager-sidebar">
      <div className="manager-brand">
        <span className="manager-brand-mark"><Icon name="dashboard" /></span>
        <span>Hotelify</span>
      </div>

      <nav className="manager-nav" aria-label="Manager navigation">
        {navItems.map((item) => (
          <NavLink
            className={({ isActive }) => `manager-sidebar-item ${isActive ? 'is-active' : ''}`}
            end={item.end}
            key={item.to}
            to={item.to}
          >
            <span className="manager-sidebar-label"><Icon name={item.icon} /><span>{item.label}</span></span>
          </NavLink>
        ))}

        {quietItems.map((item) => (
          <button className="manager-sidebar-item is-muted" key={item.label} type="button">
            <span className="manager-sidebar-label"><Icon name={item.icon} /><span>{item.label}</span></span>
          </button>
        ))}
      </nav>

      <div className="manager-promo">
        <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=420&q=80" alt="Hotel lobby" />
        <h2>Manage Smarter, Serve Better</h2>
        <p>Manage staff tasks, minibar items, and customer feedback.</p>
        <button type="button">Hotelify Manager</button>
      </div>
    </aside>

    <section className="manager-workspace">
      <header className="manager-header">
        <h1>{title}</h1>
        <div className="manager-header-actions">
          <label className="manager-search"><Icon name="search" size={18} /><input placeholder="Search placeholder" type="search" /></label>
          <button className="manager-circle-button" type="button" aria-label="Open messages"><Icon name="chat" /></button>
          <button className="manager-circle-button" type="button" aria-label="Open notifications"><Icon name="bell" /></button>
          <div className="manager-profile">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="Manager profile" />
            <span><strong>Polina Streward</strong><small>Manager</small></span>
          </div>
        </div>
      </header>

      <main className="manager-content">
        {children}
      </main>
    </section>
  </div>
);

export default ManagerShell;
