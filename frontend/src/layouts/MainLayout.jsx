import { Outlet, useLocation } from 'react-router-dom';

import AppHeader from '../components/AppHeader.jsx';

const MainLayout = () => {
  const location = useLocation();
  const hiddenHeaderPaths = ['/login', '/register', '/manager', '/receptionist'];
  const shouldShowHeader = !hiddenHeaderPaths.includes(location.pathname);

  return (
    <main className="app-shell min-h-screen">
      {shouldShowHeader ? <AppHeader /> : null}
      <Outlet />
    </main>
  );
};

export default MainLayout;
