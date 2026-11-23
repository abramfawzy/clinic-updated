import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/authStore'
import { LangToggle, Logo, ThemeToggle } from './Topbar'

export default function DashboardLayout({ links }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="min-h-screen md:flex">
      <aside
        className={`fixed inset-y-0 start-0 z-40 w-64 border-e border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-900 md:static md:translate-x-0 md:rtl:translate-x-0 ${
          open ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
        }`}
      >
        <div className="mb-8 px-2">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              {l.icon} {t(l.label)}
            </NavLink>
          ))}
        </nav>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <button className="btn-outline px-3 md:hidden" onClick={() => setOpen(true)}>
            ☰
          </button>
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold transition hover:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
          >
            <span className="max-w-[160px] truncate text-slate-800 dark:text-slate-100">
              {user?.name}
            </span>
            {user?.role && (
              <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {user.role}
              </span>
            )}
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <button
              className="btn-primary"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              {t('nav.logout')}
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}