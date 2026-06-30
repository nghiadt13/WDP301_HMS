import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <main className="min-h-screen">
      <Outlet />
    </main>
  );
};

export default MainLayout;
