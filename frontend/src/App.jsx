import { Route, Routes } from 'react-router-dom';

import ManagerDashboardPage from './features/manager/pages/ManagerDashboardPage.jsx';
import ReceptionistDashboardPage from './features/receptionist/pages/ReceptionistDashboardPage.jsx';
import RoomManagePage from './features/manager/pages/RoomManagePage.jsx';
import AddRoomPage from './features/manager/pages/AddRoomPage.jsx';
import EditRoomPage from './features/manager/pages/EditRoomPage.jsx';
import ManagerStaffTasksPage from './features/manager/pages/ManagerStaffTasksPage.jsx';
import ManagerMinibarItemsPage from './features/manager/pages/ManagerMinibarItemsPage.jsx';
import ManagerCustomerFeedbackPage from './features/manager/pages/ManagerCustomerFeedbackPage.jsx';
import ManagerLayout from './features/manager/layouts/ManagerLayout.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import BookingPage from './pages/BookingPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MyProfilePage from './pages/MyProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public routes */}
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="listRoom" element={<RoomListPage />} />
        <Route path="rooms" element={<RoomListPage />} />
        <Route path="rooms/search" element={<RoomSearchResultsPage />} />
        <Route path="rooms/:roomId" element={<RoomDetailPage />} />

        {/* Authenticated routes */}
        <Route path="profile" element={<MyProfilePage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="payment/:reservationId" element={<PaymentPage />} />

        {/* Manager routes */}
        <Route path="manager" element={<ManagerLayout />}>
          <Route index element={<ManagerDashboardPage />} />
          <Route path="rooms" element={<RoomManagePage />} />
          <Route path="rooms/add" element={<AddRoomPage />} />
          <Route path="rooms/:id/edit" element={<EditRoomPage />} />
          <Route path="staff-tasks" element={<ManagerStaffTasksPage />} />
          <Route path="minibar-items" element={<ManagerMinibarItemsPage />} />
          <Route path="feedback" element={<ManagerCustomerFeedbackPage />} />
        </Route>

        {/* Receptionist routes */}
        <Route path="receptionist" element={<ReceptionistDashboardPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;

