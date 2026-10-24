import { Routes, Route } from 'react-router-dom'
import { ROLES } from './utils/constants'

// Guards
import PrivateRoute from './guards/PrivateRoute'
import RoleRoute from './guards/RoleRoute'

// Layout
import DashboardLayout from './components/layout/DashboardLayout'

// Public Pages
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import AdminSetupPage from './pages/public/AdminSetupPage'
import AdminInvitePage from './pages/public/AdminInvitePage'
import CoachApplyPage from './pages/public/CoachApplyPage'

// Dashboard Pages
import DashboardHome from './pages/dashboard/DashboardHome'
import BookingPage from './pages/dashboard/BookingPage'
import MyBookingsPage from './pages/dashboard/MyBookingsPage'
import MembersPage from './pages/dashboard/MembersPage'
import DuesPage from './pages/dashboard/DuesPage'
import MyDuesPage from './pages/dashboard/MyDuesPage'
import CoachSchedulePage from './pages/dashboard/CoachSchedulePage'
import ProfilePage from './pages/dashboard/ProfilePage'
import CourtsPage from './pages/dashboard/CourtsPage'
import CoachesPage from './pages/dashboard/CoachesPage'
import AllBookingsPage from './pages/dashboard/AllBookingsPage'
import InviteManagementPage from './pages/dashboard/InviteManagementPage'
import CoachApplicationsPage from './pages/dashboard/CoachApplicationsPage'

// 404
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      {/* ============================
          PUBLIC ROUTES
          ============================ */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin-setup" element={<AdminSetupPage />} />
      <Route path="/admin/invite" element={<AdminInvitePage />} />
      <Route path="/careers" element={<CoachApplyPage />} />

      {/* ============================
          PROTECTED DASHBOARD ROUTES
          ============================ */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        {/* Semua role bisa akses */}
        <Route index element={<DashboardHome />} />
        <Route path="profile" element={<ProfilePage />} />

        {/* Member & Coach bisa booking */}
        <Route path="booking" element={<BookingPage />} />
        <Route path="my-bookings" element={<MyBookingsPage />} />
        <Route path="my-dues" element={<MyDuesPage />} />

        {/* ---- ADMIN ONLY ---- */}
        <Route
          path="courts"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <CourtsPage />
            </RoleRoute>
          }
        />
        <Route
          path="members"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <MembersPage />
            </RoleRoute>
          }
        />
        <Route
          path="coaches"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <CoachesPage />
            </RoleRoute>
          }
        />
        <Route
          path="all-bookings"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <AllBookingsPage />
            </RoleRoute>
          }
        />
        <Route
          path="dues"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <DuesPage />
            </RoleRoute>
          }
        />
        <Route
          path="invites"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <InviteManagementPage />
            </RoleRoute>
          }
        />
        <Route
          path="coach-applications"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <CoachApplicationsPage />
            </RoleRoute>
          }
        />

        {/* ---- ADMIN & COACH ---- */}
        <Route
          path="coach-schedule"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.COACH]}>
              <CoachSchedulePage />
            </RoleRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
