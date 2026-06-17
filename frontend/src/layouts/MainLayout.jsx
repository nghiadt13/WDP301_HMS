import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <main className="app-shell">
      <Outlet />
    </main>
  );
};

export default MainLayout;
