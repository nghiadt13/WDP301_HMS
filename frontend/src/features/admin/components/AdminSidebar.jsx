import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Shield, User } from 'lucide-react';

const sidebarItems = [
  { icon: Home, label: 'Dashboard', to: '/admin' },
  { icon: Users, label: 'Internal Accounts', to: '/admin/accounts' },
  { icon: Shield, label: 'Roles & Permissions', to: '/admin/roles' },
  { icon: User, label: 'My Profile', to: '/profile' }
];

const AdminSidebar = () => {
  const location = useLocation();

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <aside className="rm-sidebar">
      <div className="rm-brand">
        <div className="rm-brand-mark"><Shield size={16} className="text-white" /></div>
        <span>Admin Portal</span>
      </div>
      <nav className="rm-nav">
        {sidebarItems.map((item) => {
          const { icon: Icon, label, to } = item;
          const active = isActive(to) && (to === '/admin' ? location.pathname === '/admin' : true);

          return (
            <Link key={label} to={to} className={`rm-sidebar-item${active ? ' is-active' : ''}`}>
              <span className="rm-sidebar-label"><Icon size={16} /><span>{label}</span></span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
