import { Route, Routes } from 'react-router-dom';

import ManagerDashboardPage from './features/manager/pages/ManagerDashboardPage.jsx';
import RoomManagePage from './features/manager/pages/RoomManagePage.jsx';
import ManagerLayout from './features/manager/layouts/ManagerLayout.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="manager" element={<ManagerLayout />}>
          <Route index element={<ManagerDashboardPage />} />
          <Route path="rooms" element={<RoomManagePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
