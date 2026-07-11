import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar.jsx';
import AdminHeader from '../components/AdminHeader.jsx';
import '../../manager/styles/manager-layout.css'; // Reusing manager styles for admin layout

const AdminLayout = () => {
  return (
    <div className="rm-layout">
      <AdminSidebar />
      <div className="rm-workspace">
        <AdminHeader />
        <main className="rm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
