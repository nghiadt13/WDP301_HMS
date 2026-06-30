import { Route, Routes } from 'react-router-dom';

import ManagerCustomerFeedbackPage from './features/manager/pages/ManagerCustomerFeedbackPage.jsx';
import ManagerDashboardPage from './features/manager/pages/ManagerDashboardPage.jsx';
import ManagerMinibarItemsPage from './features/manager/pages/ManagerMinibarItemsPage.jsx';
import ManagerRoomTypesPage from './features/manager/pages/ManagerRoomTypesPage.jsx';
import ManagerStaffTasksPage from './features/manager/pages/ManagerStaffTasksPage.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="manager" element={<ManagerDashboardPage />} />
        <Route path="manager/room-types" element={<ManagerRoomTypesPage />} />
        <Route path="manager/staff-tasks" element={<ManagerStaffTasksPage />} />
        <Route path="manager/minibar-items" element={<ManagerMinibarItemsPage />} />
        <Route path="manager/feedback" element={<ManagerCustomerFeedbackPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
