import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { paymentsApi } from '@/features/booking/bookingApi'
import { Spinner } from '@/shared/components/ui'

// Paymob بيرجّع المستخدم هنا بعد الدفع: ?success=true&id=...
export function PaymentResultPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const success = params.get('success') === 'true'

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mb-4 text-6xl">{success ? '✅' : '❌'}</div>
      <h1 className="text-2xl font-bold">{success ? t('payments.successTitle') : t('payments.failedTitle')}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {success ? t('booking.confirmed') : t('booking.holdTimer')}
      </p>
      <Link to="/appointments" className="btn-primary mt-6">
        {t('payments.backToAppointments')}
      </Link>
    </div>
  )
}

// بوابة دفع تجريبية، بتظهر في وضع الـ mocks بس
export function MockGatewayPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const appointmentId = params.get('appointmentId')

  const complete = useMutation({
    mutationFn: (success) => paymentsApi.mockComplete(appointmentId, success),
    onSuccess: (_, success) => navigate(`/payment/result?success=${success}&appointmentId=${appointmentId}`, { replace: true }),
  })

  return (
    <div className="mx-auto max-w-md py-16">
      <div className="card space-y-4 text-center">
        <h1 className="text-xl font-bold">💳 {t('payments.title')} (Sandbox)</h1>
        <p className="text-sm text-slate-500">بوابة دفع تجريبية بتحاكي Paymob.</p>
        <button className="btn-primary w-full" disabled={complete.isPending} onClick={() => complete.mutate(true)}>
          {complete.isPending && <Spinner className="!border-white !border-t-transparent" />} ادفع بنجاح
        </button>
        <button className="btn-outline w-full" disabled={complete.isPending} onClick={() => complete.mutate(false)}>
          محاكاة فشل الدفع
        </button>
      </div>
    </div>
  )
}
