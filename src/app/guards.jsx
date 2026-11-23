import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/authStore'
import { ROLE_HOME } from '@/shared/config/env'

// الحماية هنا للتجربة بس. الأمان الحقيقي في الـ API (Policies)
export function RequireAuth({ roles }) {
  const location = useLocation()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const authed = useAuthStore((s) => s.isAuthenticated())

  if (!token || !user || !authed) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace state={{ forbidden: true }} />
  }
  return <Outlet />
}

// صفحات الدخول والتسجيل: لو المستخدم داخل بالفعل نوديه لصفحته
export function GuestOnly() {
  const user = useAuthStore((s) => s.user)
  const authed = useAuthStore((s) => s.isAuthenticated())
  if (authed && user) return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />
  return <Outlet />
}
