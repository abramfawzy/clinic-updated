import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { authApi } from './authApi'
import { useAuthStore } from './authStore'
import { ErrorBox, Field, PageLoader, Spinner } from '@/shared/components/ui'
import { getErrorMessage } from '@/shared/api/axios'

export default function UserProfilePage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const qc = useQueryClient()
  const sessionUser = useAuthStore((s) => s.user)

  const me = useQuery({
    queryKey: ['auth-me'],
    queryFn: authApi.me,
  })

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  useEffect(() => {
    const src = me.data || sessionUser
    if (src) {
      setFullName(src.fullName ?? src.name ?? '')
      setPhoneNumber(src.phoneNumber ?? '')
    }
  }, [me.data, sessionUser])

  const save = useMutation({
    mutationFn: () => authApi.updateMe({ fullName, phoneNumber: phoneNumber || null }),
    onSuccess: (updated) => {
      toast.success(isAr ? 'تم تحديث البروفايل بنجاح' : 'Profile updated')
      qc.invalidateQueries({ queryKey: ['auth-me'] })
      if (sessionUser) {
        useAuthStore.setState({
          user: { ...sessionUser, name: updated?.fullName ?? updated?.name ?? fullName },
        })
      }
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (me.isLoading && !sessionUser) return <PageLoader />
  if (me.isError && !sessionUser) return <ErrorBox message={getErrorMessage(me.error)} onRetry={me.refetch} />

  const profile = me.data || sessionUser
  const displayName = profile?.fullName ?? profile?.name ?? 'User'
  const displayRole = profile?.role ?? sessionUser?.role ?? ''
  const displayEmail = profile?.email ?? sessionUser?.email ?? ''

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card flex flex-wrap items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">{displayName}</h1>
            {displayRole && (
              <span className="rounded-full bg-brand-100 px-3 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {displayRole}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500" dir="ltr">
            {displayEmail}
          </p>
        </div>
      </div>

      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
      >
        <h2 className="text-lg font-bold">{isAr ? 'بيانات الحساب' : 'Account Details'}</h2>

        <Field label={t('auth.fullName')}>
          <input
            className="input"
            required
            minLength={2}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>

        <Field label={t('auth.email')}>
          <input className="input opacity-70" type="email" dir="ltr" disabled value={displayEmail} />
        </Field>

        <Field label={t('auth.phone')}>
          <input
            className="input"
            dir="ltr"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </Field>

        <Field label={isAr ? 'الصلاحية (Role)' : 'Role'}>
          <input className="input opacity-70" disabled value={displayRole} />
        </Field>

        <button className="btn-primary w-full" disabled={save.isPending}>
          {save.isPending && <Spinner className="!h-4 !w-4 !border-white !border-t-transparent" />}
          {isAr ? 'حفظ التعديلات' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}