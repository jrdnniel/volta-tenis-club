import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import CoachSessionsPage from './pages/dashboard/CoachSessionsPage'
import ProfilePage from './pages/dashboard/ProfilePage'
import CourtsPage from './pages/dashboard/CourtsPage'
import CoachesPage from './pages/dashboard/CoachesPage'
import MemberCoachesPage from './pages/dashboard/MemberCoachesPage'
import AllBookingsPage from './pages/dashboard/AllBookingsPage'
import InviteManagementPage from './pages/dashboard/InviteManagementPage'
import CoachApplicationsPage from './pages/dashboard/CoachApplicationsPage'
import PackagesPage from './pages/dashboard/PackagesPage'
import RateCardPage from './pages/dashboard/RateCardPage'

// 404
import NotFoundPage from './pages/NotFoundPage'

// Wrapper transisi halaman yang lembut tanpa mengubah isi file halaman
const SmoothPageTransition = ({ children }) => (
  <div className="page-smooth-enter w-full min-h-screen">
    {children}
  </div>
)

function App() {
  const location = useLocation()

  // Otomatis scroll ke atas saat berpindah halaman
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <Routes>
      {/* ============================
          PUBLIC ROUTES
          ============================ */}
      <Route path="/" element={<SmoothPageTransition><LandingPage /></SmoothPageTransition>} />
      <Route path="/login" element={<SmoothPageTransition><LoginPage /></SmoothPageTransition>} />
      <Route path="/register" element={<SmoothPageTransition><RegisterPage /></SmoothPageTransition>} />
      <Route path="/admin-setup" element={<SmoothPageTransition><AdminSetupPage /></SmoothPageTransition>} />

      {/* Admin Invite: Mendukung query (?token=xyz) maupun path parameter (/admin/invite/:token) */}
      <Route path="/admin/invite" element={<SmoothPageTransition><AdminInvitePage /></SmoothPageTransition>} />
      <Route path="/admin/invite/:token" element={<SmoothPageTransition><AdminInvitePage /></SmoothPageTransition>} />

      {/* Rekrutmen Coach: Mendukung diakses lewat /careers maupun /coach/apply */}
      <Route path="/careers" element={<SmoothPageTransition><CoachApplyPage /></SmoothPageTransition>} />
      <Route path="/coach/apply" element={<SmoothPageTransition><CoachApplyPage /></SmoothPageTransition>} />

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
        <Route path="coaches-list" element={<MemberCoachesPage />} />
        <Route path="our-coaches" element={<MemberCoachesPage />} />
        <Route path="rate-card" element={<RateCardPage />} />

        {/* Member & Coach bisa booking */}
        <Route path="booking" element={<BookingPage />} />
        <Route path="my-bookings" element={<MyBookingsPage />} />
        <Route path="my-dues" element={<MyDuesPage />} />
        <Route path="chat" element={<Navigate to="/dashboard" replace />} />

        {/* ---- ADMIN ONLY ---- */}
        <Route path="admin-chats" element={<Navigate to="/dashboard" replace />} />
        <Route path="courts" element={<Navigate to="/dashboard" replace />} />
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
        <Route
          path="packages"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <PackagesPage />
            </RoleRoute>
          }
        />

        {/* ---- ADMIN & COACH ---- */}
        <Route
          path="coach-sessions"
          element={
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.COACH]}>
              <CoachSessionsPage />
            </RoleRoute>
          }
        />
        <Route
          path="coach-schedule"
          element={
            <RoleRoute allowedRoles={[ROLES.COACH]}>
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