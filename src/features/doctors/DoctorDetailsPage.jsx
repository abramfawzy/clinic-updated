import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { bookingApi } from '@/features/booking/bookingApi'
import { useTranslation } from 'react-i18next'
import { doctorsApi } from './doctorsApi'
import { useAuthStore } from '@/features/auth/authStore'
import { ErrorBox, PageLoader, Stars } from '@/shared/components/ui'
import { formatMoney, formatTime, nextDays, toISODate } from '@/shared/lib/format'
import { getErrorMessage } from '@/shared/api/axios'

export default function DoctorDetailsPage() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const days = nextDays(7)
  const [day, setDay] = useState(toISODate(days[0]))
  const [showDoctorModal, setShowDoctorModal] = useState(false)

  const doctor = useQuery({ queryKey: ['doctor', id], queryFn: () => doctorsApi.get(id) })
  const slots = useQuery({ queryKey: ['slots', id, day], queryFn: () => doctorsApi.slots(id, day) })

  const waitlist = useMutation({
    mutationFn: () => bookingApi.joinWaitlist(id, day),
    onSuccess: () => toast.success(t('doctors.waitlistDone')),
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const pick = (start) => {
    const target = `/booking/${id}?start=${encodeURIComponent(start)}`
    if (!user) navigate('/login', { state: { from: target } })
    else navigate(target)
  }

  if (doctor.isLoading) return <PageLoader />
  if (doctor.isError) return <ErrorBox message={getErrorMessage(doctor.error)} onRetry={doctor.refetch} />
  const d = doctor.data

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowDoctorModal(true)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowDoctorModal(true)}
          className="card cursor-pointer transition hover:border-brand-500 hover:shadow-md lg:col-span-1"
        >
          <div className="flex items-start justify-between">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-brand-100 text-4xl dark:bg-brand-900/40">🩺</div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {isAr ? 'عرض ملف الدكتور' : 'View profile'}
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold">{d.name}</h1>
          <p className="text-slate-500">{d.specialty}</p>
          <div className="mt-2">
            <Stars value={d.rating} count={d.reviewsCount} />
          </div>
          {d.bio && <p className="mt-4 line-clamp-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{d.bio}</p>}
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">{t('doctors.experience')}</dt>
              <dd className="font-bold">
                {d.yearsOfExperience} {t('doctors.years')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{t('doctors.fee')}</dt>
              <dd className="font-bold">{formatMoney(d.price)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{t('doctors.followUp')}</dt>
              <dd className="font-bold">
                -{d.followUpDiscountPercent}% ({d.followUpWindowDays} {isAr ? 'يوم' : 'days'})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{t('doctors.clinic')}</dt>
              <dd className="text-end font-bold">
                {d.clinic?.name}
                <span className="block text-xs font-normal text-slate-500">{d.clinic?.address}</span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="text-lg font-bold">{t('doctors.availableSlots')}</h2>
          <p className="mb-3 mt-4 text-sm text-slate-500">{t('doctors.pickDay')}</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((x) => {
              const iso = toISODate(x)
              const active = iso === day
              return (
                <button
                  key={iso}
                  onClick={() => setDay(iso)}
                  className={`min-w-20 rounded-xl border px-3 py-2 text-center text-sm font-semibold transition ${
                    active
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-200 hover:border-brand-500 dark:border-slate-700'
                  }`}
                >
                  <span className="block text-xs opacity-80">
                    {new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-GB', { weekday: 'short' }).format(x)}
                  </span>
                  {new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' }).format(x)}
                </button>
              )
            })}
          </div>

          <div className="mt-6">
            {slots.isLoading ? (
              <PageLoader />
            ) : slots.isError ? (
              <ErrorBox message={getErrorMessage(slots.error)} onRetry={slots.refetch} />
            ) : slots.data.length === 0 || !slots.data.some((s) => s.available) ? (
              <div className="space-y-3 py-8 text-center">
                <p className="text-slate-500">{t('doctors.noSlots')}</p>
                {user?.role === 'Patient' && (
                  <button className="btn-outline" disabled={waitlist.isPending} onClick={() => waitlist.mutate()}>
                    🔔 {t('doctors.joinWaitlist')}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {slots.data.map((s) => (
                  <button
                    key={s.start}
                    disabled={!s.available}
                    onClick={() => pick(s.start)}
                    className="rounded-xl border border-slate-200 px-2 py-2 text-sm font-semibold transition hover:border-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:line-through dark:border-slate-700 dark:hover:bg-brand-900/30 dark:disabled:bg-slate-800"
                  >
                    {formatTime(s.start)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDoctorModal && (
        <div
          onClick={() => setShowDoctorModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-100 text-3xl dark:bg-brand-900/40">
                  🩺
                </div>
                <div>
                  <h2 className="text-xl font-bold">{d.name}</h2>
                  <p className="text-sm text-slate-500">{d.specialty}</p>
                  <div className="mt-1">
                    <Stars value={d.rating} count={d.reviewsCount} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDoctorModal(false)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isAr ? 'نبذة عن الطبيب' : 'About Doctor'}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                {d.bio || (isAr ? 'لا توجد نبذة تعريفية مضافة بعد.' : 'No biography provided yet.')}
              </p>
            </div>

            <dl className="mt-5 divide-y divide-slate-100 text-sm dark:divide-slate-800">
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">{t('doctors.experience')}</dt>
                <dd className="font-bold">
                  {d.yearsOfExperience} {t('doctors.years')}
                </dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">{t('doctors.fee')}</dt>
                <dd className="font-bold">{formatMoney(d.price)}</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">{t('doctors.followUp')}</dt>
                <dd className="font-bold">
                  -{d.followUpDiscountPercent}% ({d.followUpWindowDays} {isAr ? 'يوم' : 'days'})
                </dd>
              </div>
              {d.email && (
                <div className="flex justify-between py-3">
                  <dt className="text-slate-500">{isAr ? 'البريد الإلكتروني' : 'Email'}</dt>
                  <dd className="font-bold" dir="ltr">
                    {d.email}
                  </dd>
                </div>
              )}
              {d.phone && (
                <div className="flex justify-between py-3">
                  <dt className="text-slate-500">{isAr ? 'رقم الهاتف' : 'Phone'}</dt>
                  <dd className="font-bold" dir="ltr">
                    {d.phone}
                  </dd>
                </div>
              )}
              <div className="flex justify-between py-3">
                <dt className="text-slate-500">{t('doctors.clinic')}</dt>
                <dd className="text-end font-bold">
                  {d.clinic?.name}
                  {d.clinic?.address && (
                    <span className="block text-xs font-normal text-slate-500">{d.clinic.address}</span>
                  )}
                  {d.clinic?.phone && (
                    <span className="block text-xs font-normal text-slate-500" dir="ltr">
                      {d.clinic.phone}
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            <button onClick={() => setShowDoctorModal(false)} className="btn-primary mt-6 w-full">
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}