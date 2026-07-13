import { Outlet } from 'react-router-dom';
import ReceptionistSidebar from '../components/ReceptionistSidebar.jsx';
import ReceptionistHeader from '../components/ReceptionistHeader.jsx';
import '../../manager/styles/manager-layout.css';
import '../styles/receptionist-checkin.css'; // Add wizard / receptionist checkin styling

const ReceptionistLayout = () => {
  return (
    <div className="receptionist-dashboard rm-layout">
      <ReceptionistSidebar />
      <div className="rm-workspace">
        <ReceptionistHeader />
        <main className="rm-content" style={{ padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ReceptionistLayout;
