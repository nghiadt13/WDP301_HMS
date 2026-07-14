import { Outlet, useLocation } from 'react-router-dom';

import AppHeader from '../components/AppHeader.jsx';
import AppFooter from '../components/AppFooter.jsx';

const MainLayout = () => {
  const location = useLocation();
  const hiddenPrefixes = ['/login', '/register', '/manager', '/receptionist'];
  const shouldShowHeader = !hiddenPrefixes.some((prefix) => location.pathname.startsWith(prefix));

  return (
    <main className="app-shell min-h-screen">
      {shouldShowHeader ? <AppHeader /> : null}
      <Outlet />
      <AppFooter />
    </main>
  );
};

export default MainLayout;
