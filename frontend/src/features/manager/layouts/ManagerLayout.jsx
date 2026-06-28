import { Outlet } from 'react-router-dom';
import ManagerSidebar from '../components/ManagerSidebar.jsx';
import ManagerHeader from '../components/ManagerHeader.jsx';
import '../styles/manager-layout.css';

const ManagerLayout = () => {
  return (
    <div className="rm-layout">
      <ManagerSidebar />
      <div className="rm-workspace">
        <ManagerHeader />
        <main className="rm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;
