import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import CustomerFeedbackPage from './features/customer/pages/CustomerFeedbackPage.jsx';
import CustomerServiceRequestsPage from './features/customer/pages/CustomerServiceRequestsPage.jsx';
import CustomerServicesPage from './features/customer/pages/CustomerServicesPage.jsx';

import ManagerDashboardPage from './features/manager/pages/ManagerDashboardPage.jsx';
import ReceptionistDashboardPage from './features/receptionist/pages/ReceptionistDashboardPage.jsx';
import ReceptionistLayout from './features/receptionist/layouts/ReceptionistLayout.jsx';
import ReceptionistBookingListPage from './features/receptionist/pages/ReceptionistBookingListPage.jsx';
import ReceptionistBookingDetailPage from './features/receptionist/pages/ReceptionistBookingDetailPage.jsx';
import WalkinBookingForm from './features/receptionist/components/WalkinBookingForm.jsx';
import RoomManagePage from './features/manager/pages/RoomManagePage.jsx';
import AddRoomPage from './features/manager/pages/AddRoomPage.jsx';
import EditRoomPage from './features/manager/pages/EditRoomPage.jsx';
import ManagerStaffTasksPage from './features/manager/pages/ManagerStaffTasksPage.jsx';
import ManagerMinibarItemsPage from './features/manager/pages/ManagerMinibarItemsPage.jsx';
import ManagerCustomerFeedbackPage from './features/manager/pages/ManagerCustomerFeedbackPage.jsx';
import HousekeepingDashboardPage from './features/manager/pages/HousekeepingDashboardPage.jsx';
import HousekeepingTasksPage from './features/manager/pages/HousekeepingTasksPage.jsx';
import HousekeepingSchedulePage from './features/manager/pages/HousekeepingSchedulePage.jsx';
import ManagerLayout from './features/manager/layouts/ManagerLayout.jsx';


import AdminLayout from './features/admin/layouts/AdminLayout.jsx';
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage.jsx';
import AdminAccountsPage from './features/admin/pages/AdminAccountsPage.jsx';
import AdminRolesPage from './features/admin/pages/AdminRolesPage.jsx';
import AdminProfilePage from './features/admin/pages/AdminProfilePage.jsx';

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

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('hotelify_user') || 'null');
  } catch {
    return null;
  }
};

const ManagerProtectedRoute = () => {
  const location = useLocation();
  const token = localStorage.getItem('hotelify_token');
  const user = getStoredUser();
  const roleName = String(user?.role?.name || '').toLowerCase();
  const allowedHousekeepingPaths = ['/manager', '/manager/housekeeping', '/manager/housekeeping/tasks', '/manager/housekeeping/schedule', '/manager/minibar'];

  if (!token || !(roleName.includes('manager') || roleName.includes('housekeeping'))) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roleName.includes('housekeeping') && !allowedHousekeepingPaths.includes(location.pathname)) {
    return <Navigate to="/manager/housekeeping" replace state={{ from: location }} />;
  }

  if (roleName.includes('housekeeping') && location.pathname === '/manager') {
    return <Navigate to="/manager/housekeeping" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

const AdminProtectedRoute = () => {
  const location = useLocation();
  const token = localStorage.getItem('hotelify_token');
  const user = getStoredUser();
  const roleName = String(user?.role?.name || '').toLowerCase();

  if (!token || !roleName.includes('admin')) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

const ReceptionistProtectedRoute = () => {
  const location = useLocation();
  const token = localStorage.getItem('hotelify_token');
  const user = getStoredUser();
  const roleName = String(user?.role?.name || user?.role_name || user?.role || '').toLowerCase();

  if (!token || !roleName.includes('receptionist')) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};


import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
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
        <Route path="customer/services" element={<CustomerServicesPage />} />
        <Route path="customer/service-requests" element={<CustomerServiceRequestsPage />} />
        <Route path="customer/feedback" element={<CustomerFeedbackPage />} />

        {/* Manager routes */}
        <Route element={<ManagerProtectedRoute />}>
          <Route path="manager" element={<ManagerLayout />}>
            <Route index element={<ManagerDashboardPage />} />
            <Route path="rooms" element={<RoomManagePage />} />
            <Route path="rooms/add" element={<AddRoomPage />} />
            <Route path="rooms/:id/edit" element={<EditRoomPage />} />
            <Route path="housekeeping" element={<HousekeepingDashboardPage />} />
            <Route path="housekeeping/tasks" element={<HousekeepingTasksPage />} />
            <Route path="housekeeping/schedule" element={<HousekeepingSchedulePage />} />
            <Route path="staff-task" element={<ManagerStaffTasksPage />} />
            <Route path="staff-tasks" element={<ManagerStaffTasksPage />} />
            <Route path="minibar" element={<ManagerMinibarItemsPage />} />
            <Route path="minibar-items" element={<ManagerMinibarItemsPage />} />
            <Route path="feedback" element={<ManagerCustomerFeedbackPage />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="accounts" element={<AdminAccountsPage />} />
            <Route path="roles" element={<AdminRolesPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>
        </Route>

        {/* Receptionist routes */}
        <Route element={<ReceptionistProtectedRoute />}>
          <Route path="receptionist" element={<ReceptionistLayout />}>
            <Route index element={<ReceptionistDashboardPage />} />
            <Route path="bookings" element={<ReceptionistBookingListPage />} />
            <Route path="bookings/:id" element={<ReceptionistBookingDetailPage />} />
            <Route path="walkin" element={<WalkinBookingForm />} />
          </Route>
        </Route>


        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </>
  );
};

export default App;

