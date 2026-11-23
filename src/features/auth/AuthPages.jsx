import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { authApi } from './authApi'
import { useAuthStore } from './authStore'
import { getErrorMessage, getFieldErrors } from '@/shared/api/axios'
import { ROLES, ROLE_HOME } from '@/shared/config/env'
import { Field, Spinner } from '@/shared/components/ui'
import { LangToggle, Logo, ThemeToggle } from '@/app/layouts/Topbar'

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute end-4 top-4 flex gap-2">
        <LangToggle />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center">
          <Logo />
        </Link>
        <div className="card">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-4 text-center text-sm text-slate-500">{footer}</p>}
      </div>
    </div>
  )
}

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const setSession = useAuthStore((s) => s.setSession)
  const [form, setForm] = useState({ email: '', password: '' })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession(data)
      const user = useAuthStore.getState().user
      const from = location.state?.from
      navigate(from && user?.role === ROLES.Patient ? from : (ROLE_HOME[user?.role] ?? '/'), { replace: true })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const submit = (e) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  return (
    <AuthShell
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSub')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand-600">
            {t('nav.register')}
          </Link>
        </>
      }
    >
      {params.get('expired') && (
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          {t('auth.expired')}
        </p>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Field label={t('auth.email')}>
          <input
            className="input"
            type="email"
            required
            dir="ltr"
            autoComplete="username"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label={t('auth.password')}>
          <input
            className="input"
            type="password"
            required
            dir="ltr"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <button className="btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner className="!h-4 !w-4 !border-white !border-t-transparent" />}
          {t('nav.login')}
        </button>
      </form>

      {import.meta.env.DEV && (
        <p className="mt-5 rounded-xl bg-slate-100 p-3 text-xs leading-6 text-slate-600 dark:bg-slate-800 dark:text-slate-300" dir="ltr">
          {t('auth.devHint')}
        </p>
      )}
    </AuthShell>
  )
}

export function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'Male',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [accountType, setAccountType] = useState(ROLES.Patient)

  const mutation = useMutation({
    mutationFn: async (data) => {
      await authApi.register(data)
      return authApi.login({ email: data.email, password: data.password })
    },
    onSuccess: (session) => {
      setSession(session)
      navigate('/', { replace: true })
    },
    onError: (e) => {
      const fields = getFieldErrors(e)
      if (Object.keys(fields).length) setErrors(fields)
      toast.error(getErrorMessage(e))
    },
  })

  const validate = () => {
    const err = {}
    if (form.fullName.trim().length < 2) err.fullName = t('auth.errName')
    if (form.phoneNumber && !/^\+?[0-9]{8,15}$/.test(form.phoneNumber)) err.phoneNumber = t('auth.errPhone')
    if (!form.dateOfBirth) err.dateOfBirth = t('auth.errDob')
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) err.password = t('auth.errPassword')
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const submit = (e) => {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate({
      ...form,
      phoneNumber: form.phoneNumber || null,
      preferredLanguage: i18n.language === 'en' ? 'En' : 'Ar',
    })
  }

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value })
    if (errors[k]) setErrors({ ...errors, [k]: undefined })
  }

  return (
    <AuthShell
      title={t('auth.registerTitle')}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-brand-600">
            {t('nav.login')}
          </Link>
        </>
      }
    >
      <Field label={t('auth.registerAs')}>
        <select className="input" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
          <option value={ROLES.Patient}>{t(`auth.roles.${ROLES.Patient}`)}</option>
          <option value={ROLES.Doctor}>{t(`auth.roles.${ROLES.Doctor}`)}</option>
        </select>
      </Field>
      <div className="h-4" />

      {accountType === ROLES.Doctor ? (
        <div className="space-y-4 rounded-2xl bg-amber-50 p-4 text-sm leading-7 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          <p>{t('auth.doctorNotice')}</p>
          <Link to="/login" className="btn-outline w-full">
            {t('nav.login')}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label={t('auth.fullName')} error={errors.fullName}>
            <input className="input" required value={form.fullName} onChange={set('fullName')} />
          </Field>
          <Field label={t('auth.email')} error={errors.email}>
            <input className="input" type="email" required dir="ltr" value={form.email} onChange={set('email')} />
          </Field>
          <Field label={t('auth.phone')} error={errors.phoneNumber}>
            <input className="input" dir="ltr" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="01XXXXXXXXX" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('auth.dob')} error={errors.dateOfBirth}>
              <input
                className="input"
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                value={form.dateOfBirth}
                onChange={set('dateOfBirth')}
              />
            </Field>
            <Field label={t('auth.gender')} error={errors.gender}>
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="Male">{t('auth.male')}</option>
                <option value="Female">{t('auth.female')}</option>
              </select>
            </Field>
          </div>
          <Field label={t('auth.password')} error={errors.password}>
            <input className="input" type="password" required dir="ltr" value={form.password} onChange={set('password')} />
            <p className="mt-1 text-xs text-slate-500">{t('auth.passwordRule')}</p>
          </Field>
          <button className="btn-primary w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner className="!h-4 !w-4 !border-white !border-t-transparent" />}
            {t('nav.register')}
          </button>
        </form>
      )}
    </AuthShell>
  )
}