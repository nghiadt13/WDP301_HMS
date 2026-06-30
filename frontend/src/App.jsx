import { Route, Routes } from 'react-router-dom';

import ManagerDashboardPage from './features/manager/pages/ManagerDashboardPage.jsx';
import ReceptionistDashboardPage from './features/receptionist/pages/ReceptionistDashboardPage.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import BookingPage from './pages/BookingPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MyProfilePage from './pages/MyProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import RoomDetailPage from './pages/RoomDetailPage.jsx';
import RoomListPage from './pages/RoomListPage.jsx';
import RoomSearchResultsPage from './pages/RoomSearchResultsPage.jsx';

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="profile" element={<MyProfilePage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="payment/:reservationId" element={<PaymentPage />} />
        <Route path="listRoom" element={<RoomListPage />} />
        <Route path="rooms" element={<RoomListPage />} />
        <Route path="rooms/search" element={<RoomSearchResultsPage />} />
        <Route path="rooms/:roomId" element={<RoomDetailPage />} />
        <Route path="manager" element={<ManagerDashboardPage />} />
        <Route path="receptionist" element={<ReceptionistDashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
