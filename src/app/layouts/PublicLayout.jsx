import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/authStore'
import { ROLES, ROLE_HOME } from '@/shared/config/env'
import { LangToggle, Logo, ThemeToggle } from './Topbar'

const linkCls = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

export default function PublicLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isPatient = user?.role === ROLES.Patient

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={linkCls}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/doctors" className={linkCls}>
              {t('nav.doctors')}
            </NavLink>
            {isPatient && (
              <>
                <NavLink to="/appointments" className={linkCls}>
                  {t('nav.myAppointments')}
                </NavLink>
                <NavLink to="/medical" className={linkCls}>
                  {t('nav.medical')}
                </NavLink>
              </>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold transition hover:border-brand-500 dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="max-w-[120px] truncate text-slate-800 dark:text-slate-100">
                    {user.name}
                  </span>
                  {user.role && (
                    <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      {user.role}
                    </span>
                  )}
                </Link>
                {!isPatient && (
                  <Link to={ROLE_HOME[user.role]} className="btn-outline">
                    {t('nav.dashboard')}
                  </Link>
                )}
                <button
                  className="btn-primary"
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary hidden sm:inline-flex">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
        {isPatient && (
          <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden dark:border-slate-900">
            <NavLink to="/" end className={linkCls}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/doctors" className={linkCls}>
              {t('nav.doctors')}
            </NavLink>
            <NavLink to="/appointments" className={linkCls}>
              {t('nav.myAppointments')}
            </NavLink>
            <NavLink to="/medical" className={linkCls}>
              {t('nav.medical')}
            </NavLink>
            <NavLink to="/profile" className={linkCls}>
              {t('nav.profile')}
            </NavLink>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}