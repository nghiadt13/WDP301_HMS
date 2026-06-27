import { Route, Routes } from 'react-router-dom';

import ManagerDashboardPage from './features/manager/pages/ManagerDashboardPage.jsx';
import ReceptionistDashboardPage from './features/receptionist/pages/ReceptionistDashboardPage.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<NotFoundPage />} />
        <Route path="manager" element={<ManagerDashboardPage />} />
        <Route path="receptionist" element={<ReceptionistDashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
