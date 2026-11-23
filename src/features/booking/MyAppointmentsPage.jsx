import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { bookingApi, paymentsApi } from './bookingApi'
import { doctorsApi } from '@/features/doctors/doctorsApi'
import { EmptyState, ErrorBox, PageLoader, StatusBadge } from '@/shared/components/ui'
import { useCountdown } from '@/shared/hooks/useCountdown'
import { formatDateTime, formatMoney } from '@/shared/lib/format'
import { getErrorMessage } from '@/shared/api/axios'

function PendingTimer({ expiresAt, onExpire }) {
  const { t } = useTranslation()
  const { label, expired } = useCountdown(expiresAt)
  useEffect(() => {
    if (expired) onExpire?.()
  }, [expired, onExpire])
  if (expired) {
    return <span className="text-xs text-red-600">{t('booking.holdExpired')}</span>
  }
  return (
    <span className="text-xs font-semibold text-amber-600">
      ⏱ {t('booking.holdTimer')} {label}
    </span>
  )
}

function AppointmentCard({ a, doctorName, highlight, onRefresh }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [couponCode, setCouponCode] = useState('')

  const cancel = useMutation({
    mutationFn: () => bookingApi.cancel(a.id),
    onSuccess: () => {
      toast.success(t('booking.cancel'))
      qc.invalidateQueries({ queryKey: ['my-appointments'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const pay = useMutation({
    mutationFn: () => paymentsApi.initiate(a.id, couponCode.trim() || null),
    onSuccess: ({ paymentUrl }) => {
      if (!paymentUrl) return toast(t('booking.paymentSoon'), { icon: 'ℹ️', duration: 6000 })
      window.location.assign(paymentUrl)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const canCancel = ['PendingPayment', 'Confirmed'].includes(a.status)

  return (
    <div className={`card space-y-3 ${highlight ? 'ring-2 ring-brand-500' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold">{doctorName || a.doctorName || `#${a.doctorId}`}</p>
          <p className="text-sm text-slate-500">{formatDateTime(a.start)}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          {formatMoney(a.price)} · {a.paymentMethod === 'Online' ? t('booking.payOnline') : t('booking.payClinic')}
        </span>
        {a.status === 'PendingPayment' && a.expiresAt && (
          <PendingTimer expiresAt={a.expiresAt} onExpire={onRefresh} />
        )}
      </div>

      {a.status === 'PendingPayment' && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <input
            className="input !w-36 text-sm"
            dir="ltr"
            placeholder={t('booking.coupon')}
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <button className="btn-primary" disabled={pay.isPending} onClick={() => pay.mutate()}>
            💳 {t('booking.payOnline')}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canCancel && (
          <button
            className="btn-outline"
            disabled={cancel.isPending}
            onClick={() => confirm(t('booking.cancel') + '?') && cancel.mutate()}
          >
            {t('booking.cancel')}
          </button>
        )}
        <Link to="/medical" className="btn-outline">
          📎 {t('medical.attachments')}
        </Link>
      </div>
    </div>
  )
}

export default function MyAppointmentsPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const highlight = params.get('highlight')
  const q = useQuery({ queryKey: ['my-appointments'], queryFn: bookingApi.mine })
  const docs = useQuery({
    queryKey: ['doctors-lookup'],
    queryFn: () => doctorsApi.list({ pageSize: 50 }),
  })

  const doctorMap = Object.fromEntries((docs.data?.items ?? []).map((d) => [d.id, d.name]))

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.myAppointments')}</h1>
        <Link to="/doctors" className="btn-primary">
          {t('doctors.book')}
        </Link>
      </div>
      {q.isLoading ? (
        <PageLoader />
      ) : q.isError ? (
        <ErrorBox message={getErrorMessage(q.error)} onRetry={q.refetch} />
      ) : q.data.length === 0 ? (
        <EmptyState />
      ) : (
        q.data.map((a) => (
          <AppointmentCard
            key={a.id}
            a={a}
            doctorName={doctorMap[a.doctorId]}
            highlight={String(a.id) === highlight}
            onRefresh={q.refetch}
          />
        ))
      )}
    </div>
  )
}