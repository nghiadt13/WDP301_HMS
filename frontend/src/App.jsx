import { Route, Routes } from 'react-router-dom';

import ManagerDashboardPage from './features/manager/pages/ManagerDashboardPage.jsx';
import HomePage from './pages/HomePage.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="manager" element={<ManagerDashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
