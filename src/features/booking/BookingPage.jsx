import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { bookingApi, paymentsApi } from './bookingApi'
import { doctorsApi } from '@/features/doctors/doctorsApi'
import { ErrorBox, PageLoader, Spinner } from '@/shared/components/ui'
import { formatDateTime, formatMoney } from '@/shared/lib/format'
import { getErrorMessage } from '@/shared/api/axios'

export default function BookingPage() {
  const { doctorId } = useParams()
  const [params] = useSearchParams()
  const start = params.get('start')
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [method, setMethod] = useState('Online')
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState(null)

  const doctor = useQuery({ queryKey: ['doctor', doctorId], queryFn: () => doctorsApi.get(doctorId) })
  const followUp = useQuery({
    queryKey: ['followUp', doctorId, doctor.data?.followUpWindowDays],
    queryFn: () => bookingApi.followUpEligibility(doctorId, doctor.data.followUpWindowDays),
    enabled: !!doctor.data,
  })

  const applyCoupon = useMutation({
    mutationFn: () => bookingApi.validateCoupon(couponInput),
    onSuccess: (c) => {
      setCoupon(c)
      const label = c.discountType === 'Fixed' ? `-${formatMoney(c.discountValue)}` : `-${c.discountValue}%`
      toast.success(`${c.code}: ${label}`)
    },
    onError: (e) => {
      setCoupon(null)
      toast.error(getErrorMessage(e))
    },
  })

  const book = useMutation({
    mutationFn: async () => {
      const appt = await bookingApi.create({
        doctorId,
        start,
        paymentMethod: method,
        isFollowUp: !!followUp.data,
      })
      if (method === 'Online') {
        try {
          const { paymentUrl } = await paymentsApi.initiate(appt.id, coupon?.code ?? null)
          return { appt, paymentUrl }
        } catch (err) {
          return { appt, paymentError: getErrorMessage(err) }
        }
      }
      return { appt }
    },
    onSuccess: ({ appt, paymentUrl, paymentError }) => {
      toast.success(t('booking.confirmed'))
      if (paymentError) toast.error(paymentError)
      if (paymentUrl) {
        window.location.assign(paymentUrl)
      } else {
        navigate(`/appointments?highlight=${appt.id}`)
      }
    },
    onError: (e) => {
      if (e.response?.status === 409) {
        toast.error(t('booking.slotTaken'))
        navigate(`/doctors/${doctorId}`)
      } else toast.error(getErrorMessage(e))
    },
  })

  if (!start) return <Navigate to={`/doctors/${doctorId}`} replace />
  if (doctor.isLoading || (doctor.data && followUp.isLoading)) return <PageLoader />
  if (doctor.isError) return <ErrorBox message={getErrorMessage(doctor.error)} onRetry={doctor.refetch} />

  const d = doctor.data
  const original = d.price
  const followUpDiscount = followUp.data ? Math.round((original * d.followUpDiscountPercent) / 100) : 0
  const afterFollowUp = Math.max(0, original - followUpDiscount)
  const couponDiscount = !coupon
    ? 0
    : coupon.discountAmount != null
      ? coupon.discountAmount
      : coupon.discountType === 'Fixed'
        ? Math.min(afterFollowUp, coupon.discountValue)
        : Math.round((afterFollowUp * coupon.discountValue) / 100)
  const discount = followUpDiscount + couponDiscount
  const total = Math.max(0, original - discount)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t('booking.title')}</h1>

      <div className="card space-y-3">
        <h2 className="font-bold">{t('booking.summary')}</h2>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">{t('common.doctor')}</span>
          <span className="font-semibold">{d.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">{t('common.date')}</span>
          <span className="font-semibold">{formatDateTime(start)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">{t('doctors.clinic')}</span>
          <span className="font-semibold">{d.clinic?.name}</span>
        </div>
        {followUp.data && (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
            ✓ {t('doctors.followUp')} (-{d.followUpDiscountPercent}%)
          </p>
        )}
      </div>

      <div className="card space-y-3">
        <label className="label">{t('booking.coupon')}</label>
        <div className="flex gap-2">
          <input
            className="input"
            dir="ltr"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="WELCOME10"
          />
          <button
            className="btn-outline"
            disabled={!couponInput.trim() || applyCoupon.isPending}
            onClick={() => applyCoupon.mutate()}
          >
            {applyCoupon.isPending ? <Spinner /> : t('booking.applyCoupon')}
          </button>
        </div>
        {coupon && method === 'Clinic' && (
          <p className="text-xs text-amber-600">
            احتفظ بكود الكوبون ({coupon.code}) وقدمه لموظف الاستقبال عند الدفع في العيادة لتطبيق الخصم.
          </p>
        )}
      </div>

      <div className="card space-y-3">
        {['Online', 'Clinic'].map((m) => (
          <label
            key={m}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
              method === m ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} className="accent-brand-600" />
            <span className="font-semibold">{m === 'Online' ? `💳 ${t('booking.payOnline')}` : `🏥 ${t('booking.payClinic')}`}</span>
          </label>
        ))}
      </div>

      <div className="card space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">{t('booking.original')}</span>
          <span>{formatMoney(original)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>{t('booking.discount')}</span>
            <span>-{formatMoney(discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold dark:border-slate-700">
          <span>{t('booking.total')}</span>
          <span className="text-brand-700 dark:text-brand-400">{formatMoney(total)}</span>
        </div>
      </div>

      <button className="btn-primary w-full !py-3 text-base" disabled={book.isPending} onClick={() => book.mutate()}>
        {book.isPending && <Spinner className="!border-white !border-t-transparent" />}
        {t('common.confirm')}
      </button>
    </div>
  )
}