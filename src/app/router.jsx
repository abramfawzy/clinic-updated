import { createBrowserRouter, Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GuestOnly, RequireAuth } from './guards'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import { ROLES } from '@/shared/config/env'

import { LoginPage, RegisterPage } from '@/features/auth/AuthPages'
import UserProfilePage from '@/features/auth/UserProfilePage'
import HomePage from '@/features/doctors/HomePage'
import DoctorsPage from '@/features/doctors/DoctorsPage'
import DoctorDetailsPage from '@/features/doctors/DoctorDetailsPage'
import BookingPage from '@/features/booking/BookingPage'
import MyAppointmentsPage from '@/features/booking/MyAppointmentsPage'
import { PaymentResultPage } from '@/features/payments/PaymentPages'
import MedicalPage from '@/features/medical/MedicalPage'
import DoctorAgendaPage from '@/features/doctor/DoctorAgendaPage'
import DoctorSchedulePage from '@/features/doctor/DoctorSchedulePage'
import DoctorProfilePage from '@/features/doctor/DoctorProfilePage'
import AdminDashboardPage from '@/features/admin/AdminDashboardPage'
import AdminDoctorsPage from '@/features/admin/AdminDoctorsPage'
import AdminCatalogPage from '@/features/admin/AdminCatalogPage'
import AdminReceptionistsPage from '@/features/admin/AdminReceptionistsPage'
import ReceptionPage from '@/features/reception/ReceptionPage'

const doctorLinks = [
  { to: '/doctor', end: true, icon: '📅', label: 'nav.appointments' },
  { to: '/doctor/schedule', icon: '🕒', label: 'nav.schedule' },
  { to: '/doctor/profile', icon: '👤', label: 'nav.profile' },
]
const adminLinks = [
  { to: '/admin', end: true, icon: '📊', label: 'nav.dashboard' },
  { to: '/admin/doctors', icon: '🩺', label: 'nav.doctors' },
  { to: '/admin/catalog', icon: '🏥', label: 'nav.clinics' },
  { to: '/admin/receptionists', icon: '🗂️', label: 'nav.receptionists' },
]
const receptionLinks = [{ to: '/reception', end: true, icon: '🗓️', label: 'nav.appointments' }]

function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="grid min-h-screen place-items-center text-center">
      <div>
        <p className="text-7xl font-bold text-brand-600">404</p>
        <h1 className="mt-2 text-xl font-bold">{t('notFound.title')}</h1>
        <Link to="/" className="btn-primary mt-6">
          {t('notFound.back')}
        </Link>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/doctors', element: <DoctorsPage /> },
      { path: '/doctors/:id', element: <DoctorDetailsPage /> },
      {
        element: <RequireAuth />,
        children: [{ path: '/profile', element: <UserProfilePage /> }],
      },
      {
        element: <RequireAuth roles={[ROLES.Patient]} />,
        children: [
          { path: '/booking/:doctorId', element: <BookingPage /> },
          { path: '/appointments', element: <MyAppointmentsPage /> },
          { path: '/medical', element: <MedicalPage /> },
          { path: '/payment/result', element: <PaymentResultPage /> },
        ],
      },
    ],
  },

  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },

  {
    element: <RequireAuth roles={[ROLES.Doctor]} />,
    children: [
      {
        element: <DashboardLayout links={doctorLinks} />,
        children: [
          { path: '/doctor', element: <DoctorAgendaPage /> },
          { path: '/doctor/schedule', element: <DoctorSchedulePage /> },
          { path: '/doctor/profile', element: <DoctorProfilePage /> },
        ],
      },
    ],
  },

  {
    element: <RequireAuth roles={[ROLES.Admin]} />,
    children: [
      {
        element: <DashboardLayout links={adminLinks} />,
        children: [
          { path: '/admin', element: <AdminDashboardPage /> },
          { path: '/admin/doctors', element: <AdminDoctorsPage /> },
          { path: '/admin/catalog', element: <AdminCatalogPage /> },
          { path: '/admin/receptionists', element: <AdminReceptionistsPage /> },
        ],
      },
    ],
  },

  {
    element: <RequireAuth roles={[ROLES.Receptionist]} />,
    children: [
      {
        element: <DashboardLayout links={receptionLinks} />,
        children: [{ path: '/reception', element: <ReceptionPage /> }],
      },
    ],
  },

  { path: '/home', element: <Navigate to="/" replace /> },
  { path: '*', element: <NotFound /> },
])